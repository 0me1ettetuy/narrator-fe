import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AudioLinesIcon,
  CircleAlertIcon,
  CircleStopIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerCancelSelectedChapterAudioMutation,
  booksControllerGetBookQueryKey,
  booksControllerListActiveAudioQueryKey,
  booksControllerQueueSelectedChapterAudioMutation,
  ttsModelsControllerListModelsOptions,
  getApiErrorTranslationKey,
  type ChapterSummaryResponseDto,
  type TtsModelsResponseDto,
} from '@/shared/api';
import { cn } from '@/shared/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Separator } from '@/shared/ui/separator';
import { useLocalVoice, type LocalVoiceSelection } from '../model/local-voice';
import { getTtsSelection } from '../model/tts-selection';
import { ChapterRow } from './ChapterRow';
import { TtsSelector } from './TtsSelector';

type BatchQueueAction =
  'generate' | 'continue' | 'generateOrContinue' | 'regenerate';

type ChapterNarrationProps = {
  bookId: string;
  language: string | null;
  chapters: ChapterSummaryResponseDto[];
  // Narrate mode: selection, generation and menus. Otherwise chapters play.
  isEditing: boolean;
  // Sticky offset of the batch toolbar: below the app header by default.
  toolbarClassName?: string;
};

export function ChapterNarration({
  bookId,
  language,
  chapters,
  isEditing,
  toolbarClassName = 'top-14',
}: ChapterNarrationProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);
  // Chapters tagged "not narrated" are skipped by generation, so they can't be selected.
  const selectableChapters = chapters.filter(
    (chapter) => chapter.includeInDefaultNarration,
  );
  const selectedChapters = selectableChapters.filter((chapter) =>
    selectedChapterIds.includes(chapter.id),
  );
  // Narrated-chapters quick select hidden; see
  // docs/issues/chapter-tags-and-narrated-selector-hidden.md.
  // const narratedChapterIds = chapters
  //   .filter((chapter) => chapter.includeInDefaultNarration)
  //   .map((chapter) => chapter.id);
  // const selectedNarratedChapterCount = chapters.filter(
  //   (chapter) =>
  //     chapter.includeInDefaultNarration &&
  //     selectedChapterIds.includes(chapter.id),
  // ).length;
  // Selecting chapters that already have audio turns Generate into Regenerate,
  // which replaces that audio (after a confirmation).
  const readyChapters = selectedChapters.filter(isChapterAudioReady);
  const readyChapterCount = readyChapters.length;
  const queueableChapterIds = selectedChapters
    .filter(
      (chapter) =>
        canQueueChapterAudio(chapter) ||
        (readyChapterCount > 0 && isChapterAudioReady(chapter)),
    )
    .map((chapter) => chapter.id);
  const stoppableChapterIds = selectedChapters
    .filter(canStopChapterAudio)
    .map((chapter) => chapter.id);
  const batchQueueAction = getBatchQueueAction(selectedChapters);
  const queueSelectedAudio = useMutation({
    ...booksControllerQueueSelectedChapterAudioMutation(),
    onSuccess: async () => {
      await invalidateBook();
    },
  });
  const cancelSelectedAudio = useMutation({
    ...booksControllerCancelSelectedChapterAudioMutation(),
    onSuccess: async () => {
      await invalidateBook();
    },
  });
  const isBatchActionPending =
    queueSelectedAudio.isPending || cancelSelectedAudio.isPending;
  const batchActionError =
    queueSelectedAudio.error ?? cancelSelectedAudio.error;
  const modelsQuery = useQuery({
    ...ttsModelsControllerListModelsOptions(),
    staleTime: 5 * 60 * 1_000,
  });
  const ttsSelection = getTtsSelection(modelsQuery.data);
  const canQueueAudio = ttsSelection.isComplete;
  const localVoice = useLocalVoice(ttsSelection.selectedModel, language);

  function toggleChapterSelection(chapterId: string, selected: boolean) {
    setSelectedChapterIds((current) => {
      if (selected) {
        return current.includes(chapterId) ? current : [...current, chapterId];
      }

      return current.filter((id) => id !== chapterId);
    });
  }

  // function setNarratedChapterSelection(selected: boolean) {
  //   setSelectedChapterIds((current) => {
  //     const selectedIds = new Set(current);
  //
  //     for (const chapterId of narratedChapterIds) {
  //       if (selected) {
  //         selectedIds.add(chapterId);
  //       } else {
  //         selectedIds.delete(chapterId);
  //       }
  //     }
  //
  //     return chapters
  //       .filter((chapter) => selectedIds.has(chapter.id))
  //       .map((chapter) => chapter.id);
  //   });
  // }

  // The select-all control cycles: chapters without audio -> every chapter
  // -> none. Its label always names what the next click will select.
  const everyChapterIds = selectableChapters.map((chapter) => chapter.id);
  const withoutAudioChapterIds = selectableChapters
    .filter(canQueueChapterAudio)
    .map((chapter) => chapter.id);
  const isSelection = (ids: string[]) =>
    ids.length === selectedChapterIds.length &&
    ids.every((id) => selectedChapterIds.includes(id));
  const nextEverySelection = isSelection(everyChapterIds)
    ? { ids: [], labelKey: 'book.clearSelection' as const }
    : withoutAudioChapterIds.length === 0 || isSelection(withoutAudioChapterIds)
      ? { ids: everyChapterIds, labelKey: 'book.selectAllAction' as const }
      : {
          ids: withoutAudioChapterIds,
          labelKey: 'book.selectWithoutAudio' as const,
        };

  function queueSelectedChapters() {
    cancelSelectedAudio.reset();
    queueSelectedAudio.mutate({
      path: { bookId: bookId },
      body: {
        chapterIds: queueableChapterIds,
        voiceId: localVoice.voiceId ?? undefined,
        regenerate: readyChapterCount > 0 || undefined,
      },
    });
  }

  function requestQueue() {
    if (readyChapterCount > 0) {
      setIsRegenerateConfirmOpen(true);
    } else {
      queueSelectedChapters();
    }
  }

  function cancelSelectedChapters() {
    queueSelectedAudio.reset();
    cancelSelectedAudio.mutate({
      path: { bookId: bookId },
      body: { chapterIds: stoppableChapterIds },
    });
  }

  async function invalidateBook() {
    void queryClient.invalidateQueries({
      queryKey: booksControllerListActiveAudioQueryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: booksControllerGetBookQueryKey({
        path: { bookId: bookId },
      }),
    });
  }

  return (
    <>
      {isEditing && (
        <ChapterBatchActions
          totalChapters={selectableChapters.length}
          selectedChapterCount={selectedChapters.length}
          queueableChapterCount={queueableChapterIds.length}
          stoppableChapterCount={stoppableChapterIds.length}
          queueAction={batchQueueAction}
          isPending={isBatchActionPending}
          error={batchActionError}
          models={modelsQuery.data}
          isModelsLoading={modelsQuery.isLoading}
          canQueueAudio={canQueueAudio}
          localVoice={localVoice}
          className={toolbarClassName}
          everyChapterLabel={t(nextEverySelection.labelKey)}
          onEveryChapterSelectionChange={() =>
            setSelectedChapterIds(nextEverySelection.ids)
          }
          onQueue={requestQueue}
          onCancel={cancelSelectedChapters}
        />
      )}

      <ol>
        {chapters.map((chapter) => (
          <ChapterRow
            key={chapter.id}
            bookId={bookId}
            chapter={chapter}
            isSelected={selectedChapterIds.includes(chapter.id)}
            canQueueAudio={canQueueAudio}
            voiceId={localVoice.voiceId ?? undefined}
            canEdit={isEditing}
            showPlayer={!isEditing}
            onSelectionChange={(selected) =>
              toggleChapterSelection(chapter.id, selected)
            }
          />
        ))}
      </ol>

      <AlertDialog
        open={isRegenerateConfirmOpen}
        onOpenChange={setIsRegenerateConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia variant="destructive">
              <RotateCcwIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>{t('book.regenerateTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('book.regenerateDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="max-h-60 divide-y overflow-y-auto border bg-muted/30 text-sm">
            {readyChapters.map((chapter) => (
              <li
                key={chapter.id}
                className="flex items-baseline gap-3 px-3 py-2"
              >
                <span className="w-20 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {t('book.chapterNumber', { number: chapter.position + 1 })}
                </span>
                <span className="min-w-0 flex-1 truncate" title={chapter.title}>
                  {chapter.title}
                </span>
              </li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              onClick={queueSelectedChapters}
            >
              {t('book.regenerateConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ChapterBatchActions({
  totalChapters,
  selectedChapterCount,
  queueableChapterCount,
  stoppableChapterCount,
  queueAction,
  isPending,
  error,
  models,
  isModelsLoading,
  canQueueAudio,
  localVoice,
  className,
  everyChapterLabel,
  onEveryChapterSelectionChange,
  onQueue,
  onCancel,
}: {
  totalChapters: number;
  selectedChapterCount: number;
  queueableChapterCount: number;
  stoppableChapterCount: number;
  queueAction: BatchQueueAction;
  isPending: boolean;
  error: unknown;
  models: TtsModelsResponseDto | undefined;
  isModelsLoading: boolean;
  canQueueAudio: boolean;
  localVoice: LocalVoiceSelection;
  className: string;
  everyChapterLabel: string;
  onEveryChapterSelectionChange: () => void;
  onQueue: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const generateLabel = getBatchQueueLabel(queueAction, t);
  const areAllChaptersSelected =
    totalChapters > 0 && selectedChapterCount === totalChapters;
  const areAllChaptersIndeterminate =
    selectedChapterCount > 0 && !areAllChaptersSelected;

  return (
    <div
      role="toolbar"
      aria-label={t('book.chapterActions')}
      className={cn(
        'sticky z-10 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-foreground bg-background py-3 pr-0 pl-4',
        className,
      )}
    >
      <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <legend className="sr-only">{t('book.chapterSelection')}</legend>
        <Field orientation="horizontal" className="w-auto">
          <Checkbox
            id="select-every-chapter"
            checked={areAllChaptersSelected}
            indeterminate={areAllChaptersIndeterminate}
            disabled={isPending}
            onCheckedChange={() => onEveryChapterSelectionChange()}
          />
          <FieldLabel
            htmlFor="select-every-chapter"
            className="text-sm font-medium tracking-normal normal-case"
          >
            {everyChapterLabel}
          </FieldLabel>
        </Field>
        <Separator orientation="vertical" className="h-4" />
        <span
          aria-live="polite"
          className={cn(
            'text-[13px] text-muted-foreground',
            selectedChapterCount > 0 && 'font-medium text-foreground',
          )}
        >
          {t('book.chaptersSelected', { count: selectedChapterCount })}
        </span>
      </fieldset>
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        {stoppableChapterCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="max-sm:w-full"
            disabled={isPending}
            onClick={onCancel}
          >
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : (
              <CircleStopIcon aria-hidden="true" />
            )}
            {isPending ? t('book.audioStopping') : t('book.stopSelectedAudio')}
          </Button>
        ) : null}
        <TtsSelector
          models={models}
          isLoading={isModelsLoading}
          localVoice={localVoice}
        />
        <Button
          type="button"
          size="sm"
          className="max-sm:w-full"
          disabled={queueableChapterCount === 0 || isPending || !canQueueAudio}
          onClick={onQueue}
        >
          {isPending ? (
            <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
          ) : (
            <AudioLinesIcon aria-hidden="true" />
          )}
          {isPending ? t('book.audioQueueing') : generateLabel}
        </Button>
      </div>
      {!isModelsLoading && !canQueueAudio ? (
        <Alert aria-live="polite" className="basis-full">
          <CircleAlertIcon aria-hidden="true" />
          <AlertDescription>
            {t('book.ttsSelector.selectionIncomplete')}
          </AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive" className="basis-full">
          <CircleAlertIcon aria-hidden="true" />
          <AlertDescription>
            {t(getApiErrorTranslationKey(error))}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

function canQueueChapterAudio(chapter: ChapterSummaryResponseDto): boolean {
  return (
    !chapter.audio ||
    chapter.audio.status === 'FAILED' ||
    chapter.audio.status === 'CANCELLED'
  );
}

function canStopChapterAudio(chapter: ChapterSummaryResponseDto): boolean {
  return (
    chapter.audio?.status === 'QUEUED' || chapter.audio?.status === 'PROCESSING'
  );
}

function isChapterAudioReady(chapter: ChapterSummaryResponseDto): boolean {
  return chapter.audio?.status === 'READY';
}

function getBatchQueueAction(
  chapters: ChapterSummaryResponseDto[],
): BatchQueueAction {
  if (chapters.some(isChapterAudioReady)) {
    return 'regenerate';
  }

  const hasNewAudio = chapters.some((chapter) => !chapter.audio);
  const hasResumableAudio = chapters.some(
    (chapter) =>
      chapter.audio?.status === 'FAILED' ||
      chapter.audio?.status === 'CANCELLED',
  );

  if (hasNewAudio && hasResumableAudio) {
    return 'generateOrContinue';
  }

  return hasResumableAudio ? 'continue' : 'generate';
}

function getBatchQueueLabel(
  action: BatchQueueAction,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  switch (action) {
    case 'continue':
      return t('book.continueSelectedAudio');
    case 'generateOrContinue':
      return t('book.generateOrContinueSelectedAudio');
    case 'regenerate':
      return t('book.regenerateSelectedAudio');
    case 'generate':
      return t('book.generateSelectedAudio');
  }
}
