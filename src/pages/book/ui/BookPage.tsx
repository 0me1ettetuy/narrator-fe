import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AudioLinesIcon,
  BookOpenIcon,
  CircleStopIcon,
  DownloadIcon,
  FileTextIcon,
  LanguagesIcon,
  LoaderCircleIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  Trash2Icon,
} from 'lucide-react';
import { useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerCancelChapterAudioMutation,
  booksControllerCancelSelectedChapterAudioMutation,
  booksControllerDeleteChapterAudioMutation,
  booksControllerGetBookCoverAccessOptions,
  booksControllerGetChapterAudioAccessOptions,
  booksControllerGetChapterAudioAccessQueryKey,
  booksControllerGetBookQueryKey,
  booksControllerGetBookOptions,
  booksControllerQueueChapterAudioMutation,
  booksControllerQueueSelectedChapterAudioMutation,
  ttsModelsControllerListModelsOptions,
  type BookDetailResponseDto,
  type ChapterAudioAccessResponseDto,
  type ChapterAudioResponseDto,
  type ChapterSummaryResponseDto,
  getApiErrorTranslationKey,
} from '@/shared/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { DataState } from '@/shared/ui/data-state';
import { cn } from '@/shared/lib/utils';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';
import { Slider } from '@/shared/ui/slider';
import { ChapterCurationPanel } from './ChapterCurationPanel';

type BookPageProps = {
  bookId: string;
};

type BookStatus = {
  label: string;
  variant: ComponentProps<typeof Badge>['variant'];
};

type BatchQueueAction = 'generate' | 'continue' | 'generateOrContinue';

export function BookPage({ bookId }: BookPageProps) {
  const bookOptions = { path: { bookId } };
  const bookQuery = useQuery({
    ...booksControllerGetBookOptions(bookOptions),
    refetchInterval: (query) =>
      shouldPollBook(query.state.data) ? 1_000 : false,
  });

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <DataState
        query={bookQuery}
        isEmpty={() => false}
        loading={<BookPageSkeleton />}
      >
        {(data) => <BookDetails book={data} />}
      </DataState>
    </section>
  );
}

function BookDetails({ book }: { book: BookDetailResponseDto }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const status = getBookStatus(book.book.parseStatus, t);
  const authors = book.authors.map((author) => author.name).join(', ');
  const selectedChapters = book.chapters.filter((chapter) =>
    selectedChapterIds.includes(chapter.id),
  );
  const narratedChapterIds = book.chapters
    .filter((chapter) => chapter.includeInDefaultNarration)
    .map((chapter) => chapter.id);
  const selectedNarratedChapterCount = book.chapters.filter(
    (chapter) =>
      chapter.includeInDefaultNarration &&
      selectedChapterIds.includes(chapter.id),
  ).length;
  const queueableChapterIds = selectedChapters
    .filter(canQueueChapterAudio)
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
  const coverQuery = useQuery({
    ...booksControllerGetBookCoverAccessOptions({
      path: { bookId: book.book.id },
    }),
    enabled: book.book.hasCover,
    staleTime: 14 * 60 * 1_000,
  });
  const modelsQuery = useQuery({
    ...ttsModelsControllerListModelsOptions(),
    staleTime: 5 * 60 * 1_000,
  });
  const voiceNamesByReferenceId = new Map(
    (modelsQuery.data?.providers ?? [])
      .flatMap((provider) => provider.voices)
      .map((voice) => [voice.referenceId, voice.name]),
  );

  function toggleChapterSelection(chapterId: string, selected: boolean) {
    setSelectedChapterIds((current) => {
      if (selected) {
        return current.includes(chapterId) ? current : [...current, chapterId];
      }

      return current.filter((id) => id !== chapterId);
    });
  }

  function setNarratedChapterSelection(selected: boolean) {
    setSelectedChapterIds((current) => {
      const selectedIds = new Set(current);

      for (const chapterId of narratedChapterIds) {
        if (selected) {
          selectedIds.add(chapterId);
        } else {
          selectedIds.delete(chapterId);
        }
      }

      return book.chapters
        .filter((chapter) => selectedIds.has(chapter.id))
        .map((chapter) => chapter.id);
    });
  }

  function setEveryChapterSelection(selected: boolean) {
    setSelectedChapterIds(
      selected ? book.chapters.map((chapter) => chapter.id) : [],
    );
  }

  function queueSelectedChapters() {
    cancelSelectedAudio.reset();
    queueSelectedAudio.mutate({
      path: { bookId: book.book.id },
      body: { chapterIds: queueableChapterIds },
    });
  }

  function cancelSelectedChapters() {
    queueSelectedAudio.reset();
    cancelSelectedAudio.mutate({
      path: { bookId: book.book.id },
      body: { chapterIds: stoppableChapterIds },
    });
  }

  async function invalidateBook() {
    await queryClient.invalidateQueries({
      queryKey: booksControllerGetBookQueryKey({
        path: { bookId: book.book.id },
      }),
    });
  }

  return (
    <div className="space-y-8">
      <BookOverview
        book={book.book}
        authors={authors || t('book.unknownAuthor')}
        status={status}
        coverUrl={coverQuery.data?.coverUrl}
        onCoverError={() => {
          void coverQuery.refetch();
        }}
      />

      <section aria-labelledby="chapters-title">
        <div
          className={cn(
            '-mx-4 px-4',
            book.chapters.length > 0 &&
              'sticky top-0 z-10 border-b bg-background py-3',
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-2">
              <h2 id="chapters-title" className="text-xl font-semibold">
                {t('book.chaptersTitle')}
              </h2>
              <span className="text-sm text-muted-foreground">
                {t('library.chapterCount', { count: book.chapters.length })}
              </span>
            </div>
            {book.chapters.length > 0 && (
              <ChapterCurationPanel
                bookId={book.book.id}
                chapters={book.chapters}
                selectedChapterIds={selectedChapterIds}
                onBookChanged={invalidateBook}
                onSelectionCleared={() => setEveryChapterSelection(false)}
              />
            )}
          </div>

          {book.chapters.length > 0 && (
            <ChapterBatchActions
              totalChapters={book.chapters.length}
              selectedChapterCount={selectedChapters.length}
              narratedChapterCount={narratedChapterIds.length}
              selectedNarratedChapterCount={selectedNarratedChapterCount}
              queueableChapterCount={queueableChapterIds.length}
              stoppableChapterCount={stoppableChapterIds.length}
              queueAction={batchQueueAction}
              isPending={isBatchActionPending}
              error={batchActionError}
              onNarratedSelectionChange={setNarratedChapterSelection}
              onEveryChapterSelectionChange={setEveryChapterSelection}
              onQueue={queueSelectedChapters}
              onCancel={cancelSelectedChapters}
            />
          )}
        </div>

        {book.chapters.length > 0 ? (
          <>
            <ol className="mt-3 space-y-2">
              {book.chapters.map((chapter) => (
                <li key={chapter.id}>
                  <ChapterCard
                    bookId={book.book.id}
                    chapter={chapter}
                    voiceName={
                      chapter.audio?.voice
                        ? voiceNamesByReferenceId.get(chapter.audio.voice)
                        : undefined
                    }
                    isSelected={selectedChapterIds.includes(chapter.id)}
                    onSelectionChange={(selected) =>
                      toggleChapterSelection(chapter.id, selected)
                    }
                  />
                </li>
              ))}
            </ol>
          </>
        ) : (
          <Card className="mt-3">
            <CardContent className="text-muted-foreground">
              {getChaptersMessage(book.book.parseStatus, t)}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function BookOverview({
  book,
  authors,
  status,
  coverUrl,
  onCoverError,
}: {
  book: BookDetailResponseDto['book'];
  authors: string;
  status: BookStatus;
  coverUrl: string | undefined;
  onCoverError: () => void;
}) {
  const { t, i18n } = useTranslation();

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 sm:flex-row sm:gap-6">
        {book.hasCover &&
          (coverUrl ? (
            <img
              src={coverUrl}
              alt={t('book.coverAlt', { title: book.title })}
              className="mx-auto h-40 w-27 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10 sm:mx-0 sm:h-48 sm:w-32"
              onError={onCoverError}
            />
          ) : (
            <div
              className="mx-auto flex h-40 w-27 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-foreground/10 sm:mx-0 sm:h-48 sm:w-32"
              aria-hidden="true"
            >
              <BookOpenIcon className="size-7" />
            </div>
          ))}

        <div className="flex min-w-0 flex-1 flex-col">
          <div>
            <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
              {book.title}
            </h1>
            <p className="mt-2 text-muted-foreground">{authors}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant="outline">{book.sourceFormat}</Badge>
            </div>
          </div>

          <dl className="mt-5 grid gap-x-6 gap-y-4 border-t pt-4 text-sm sm:grid-cols-2">
            <BookMetadata
              className="sm:col-span-2"
              label={t('book.fileName')}
              value={book.sourceOriginalFilename}
              icon={<FileTextIcon aria-hidden="true" />}
            />
            <BookMetadata
              label={t('book.fileSize')}
              value={formatFileSize(book.sourceSize, i18n.language)}
              icon={<FileTextIcon aria-hidden="true" />}
            />
            {book.language && (
              <BookMetadata
                label={t('book.language')}
                value={book.language}
                icon={<LanguagesIcon aria-hidden="true" />}
              />
            )}
            <BookMetadata
              label={t('book.chaptersTitle')}
              value={t('library.chapterCount', {
                count: book.chapterCount,
              })}
              icon={<BookOpenIcon aria-hidden="true" />}
            />
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}

function ChapterBatchActions({
  totalChapters,
  selectedChapterCount,
  narratedChapterCount,
  selectedNarratedChapterCount,
  queueableChapterCount,
  stoppableChapterCount,
  queueAction,
  isPending,
  error,
  onNarratedSelectionChange,
  onEveryChapterSelectionChange,
  onQueue,
  onCancel,
}: {
  totalChapters: number;
  selectedChapterCount: number;
  narratedChapterCount: number;
  selectedNarratedChapterCount: number;
  queueableChapterCount: number;
  stoppableChapterCount: number;
  queueAction: BatchQueueAction;
  isPending: boolean;
  error: unknown;
  onNarratedSelectionChange: (selected: boolean) => void;
  onEveryChapterSelectionChange: (selected: boolean) => void;
  onQueue: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const generateLabel = getBatchQueueLabel(queueAction, t);
  const areNarratedChaptersSelected =
    narratedChapterCount > 0 &&
    selectedNarratedChapterCount === narratedChapterCount;
  const areNarratedChaptersIndeterminate =
    selectedNarratedChapterCount > 0 && !areNarratedChaptersSelected;
  const areAllChaptersSelected =
    totalChapters > 0 && selectedChapterCount === totalChapters;
  const areAllChaptersIndeterminate =
    selectedChapterCount > 0 && !areAllChaptersSelected;

  return (
    <Card className="mt-3 border-border/70 bg-muted/25 py-2" size="sm">
      <CardContent className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-wrap items-center justify-start gap-1 lg:w-auto">
          {stoppableChapterCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={onCancel}
            >
              {isPending ? (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              ) : (
                <CircleStopIcon aria-hidden="true" />
              )}
              {isPending
                ? t('book.audioStopping')
                : t('book.stopSelectedAudio')}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            disabled={queueableChapterCount === 0 || isPending}
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

        <fieldset className="flex max-w-full flex-wrap items-center gap-1 rounded-lg border bg-background/50 p-1 lg:ml-auto">
          <legend className="sr-only">{t('book.chapterSelection')}</legend>
          <ChapterSelectionControl
            id="select-narrated-chapters"
            label={t('book.narratedChapters')}
            checked={areNarratedChaptersSelected}
            indeterminate={areNarratedChaptersIndeterminate}
            disabled={isPending || narratedChapterCount === 0}
            onCheckedChange={onNarratedSelectionChange}
          />
          <ChapterSelectionControl
            id="select-every-chapter"
            label={t('book.everyChapter')}
            checked={areAllChaptersSelected}
            indeterminate={areAllChaptersIndeterminate}
            disabled={isPending}
            onCheckedChange={onEveryChapterSelectionChange}
          />
          <span
            className="mx-1 hidden h-4 w-px bg-border sm:block"
            aria-hidden="true"
          />
          <Badge
            variant={selectedChapterCount > 0 ? 'default' : 'secondary'}
            className="rounded-md"
            aria-live="polite"
          >
            {t('book.chaptersSelected', { count: selectedChapterCount })}
          </Badge>
        </fieldset>
      </CardContent>
      {error ? (
        <CardContent className="border-t pt-4">
          <p className="text-sm text-destructive" role="alert">
            {t(getApiErrorTranslationKey(error))}
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function ChapterSelectionControl({
  id,
  label,
  checked,
  indeterminate,
  disabled,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const isActive = checked || indeterminate;

  return (
    <label
      htmlFor={id}
      className={cn(
        'flex h-7 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-background text-foreground ring-1 ring-foreground/10'
          : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
        disabled && 'cursor-not-allowed opacity-50',
        !disabled && 'cursor-pointer',
      )}
    >
      <span className="whitespace-nowrap">{label}</span>
      <Checkbox
        id={id}
        checked={checked}
        indeterminate={indeterminate}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </label>
  );
}

function ChapterCard({
  bookId,
  chapter,
  voiceName,
  isSelected,
  onSelectionChange,
}: {
  bookId: string;
  chapter: ChapterSummaryResponseDto;
  voiceName: string | undefined;
  isSelected: boolean;
  onSelectionChange: (selected: boolean) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteAudio = useMutation({
    ...booksControllerDeleteChapterAudioMutation(),
    onSuccess: async () => {
      setIsDeleteDialogOpen(false);
      clearAudioAccess();
      await invalidateBook();
    },
  });
  const queueAudio = useMutation({
    ...booksControllerQueueChapterAudioMutation(),
    onSuccess: async () => {
      clearAudioAccess();
      await invalidateBook();
    },
  });
  const cancelAudio = useMutation({
    ...booksControllerCancelChapterAudioMutation(),
    onSuccess: async () => {
      await invalidateBook();
    },
  });
  const audioAccess = useQuery({
    ...booksControllerGetChapterAudioAccessOptions({
      path: { bookId, chapterId: chapter.id },
    }),
    enabled: chapter.audio?.status === 'READY',
    staleTime: 14 * 60 * 1_000,
  });
  const audioStatus = getAudioStatus(chapter.audio, t);
  const progress = getAudioProgress(chapter.audio);
  const isDeleting =
    deleteAudio.isPending || chapter.audio?.status === 'DELETING';
  const isAudioActionPending = queueAudio.isPending || cancelAudio.isPending;
  const mutationError =
    deleteAudio.error ?? queueAudio.error ?? cancelAudio.error;

  function deleteChapterAudio() {
    deleteAudio.mutate({ path: { bookId, chapterId: chapter.id } });
  }

  function queueChapterAudio() {
    cancelAudio.reset();
    queueAudio.mutate({ path: { bookId, chapterId: chapter.id } });
  }

  function cancelChapterAudio() {
    queueAudio.reset();
    cancelAudio.mutate({ path: { bookId, chapterId: chapter.id } });
  }

  async function invalidateBook() {
    await queryClient.invalidateQueries({
      queryKey: booksControllerGetBookQueryKey({ path: { bookId } }),
    });
  }

  function clearAudioAccess() {
    queryClient.removeQueries({
      queryKey: booksControllerGetChapterAudioAccessQueryKey({
        path: { bookId, chapterId: chapter.id },
      }),
    });
  }

  const deleteAudioAction =
    chapter.audio?.status === 'READY' && !isDeleting ? (
      <ChapterAudioDeleteAction
        isOpen={isDeleteDialogOpen}
        isPending={deleteAudio.isPending}
        onDelete={deleteChapterAudio}
        onOpenChange={setIsDeleteDialogOpen}
      />
    ) : null;
  const chapterAudioAction = getChapterAudioAction(
    chapter,
    t,
    isAudioActionPending,
    queueChapterAudio,
    cancelChapterAudio,
  );

  return (
    <Card
      size="sm"
      className={cn(
        'gap-2 transition-[background-color,box-shadow] duration-150',
        isSelected && 'bg-primary/5 ring-2 ring-primary',
      )}
    >
      <CardHeader className="gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span className="font-medium">
              {t('book.chapterNumber', { number: chapter.position + 1 })}
            </span>
            <span
              className="size-1 rounded-full bg-muted-foreground/50"
              aria-hidden="true"
            />
            <span className="tabular-nums">
              {t('book.wordCount', { count: chapter.wordCount })}
            </span>
          </div>
          <CardTitle
            className="mt-1 break-words text-base leading-snug"
            title={chapter.title}
          >
            {chapter.title}
          </CardTitle>
        </div>

        <CardAction>
          <Checkbox
            className="cursor-pointer"
            checked={isSelected}
            aria-label={t('book.selectChapter', { title: chapter.title })}
            onCheckedChange={(checked) => onSelectionChange(checked === true)}
          />
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant={
              chapter.includeInDefaultNarration ? 'default' : 'secondary'
            }
          >
            {t(`book.roles.${chapter.role}`)}
          </Badge>
          {!chapter.includeInDefaultNarration && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {t('book.excludedFromNarration')}
            </span>
          )}
          {chapter.classificationReason && (
            <span
              className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground"
              title={chapter.classificationReason}
            >
              {t('book.parserSuggestion')}
            </span>
          )}
        </div>

        {audioStatus && chapter.audio && (
          <ChapterAudioStatus
            audio={chapter.audio}
            status={audioStatus}
            progress={progress}
            voiceName={voiceName}
            action={chapterAudioAction}
          />
        )}

        {mutationError && (
          <p className="text-sm text-destructive" role="alert">
            {t(getApiErrorTranslationKey(mutationError))}
          </p>
        )}
      </CardContent>

      {chapter.audio?.status === 'READY' && (
        <CardContent className="border-t pt-4">
          <ChapterAudioControls
            access={audioAccess}
            action={deleteAudioAction}
          />
        </CardContent>
      )}
    </Card>
  );
}

function ChapterAudioDeleteAction({
  isOpen,
  isPending,
  onDelete,
  onOpenChange,
}: {
  isOpen: boolean;
  isPending: boolean;
  onDelete: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="border-destructive/35 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
            aria-label={t('book.deleteAudio')}
            title={t('book.deleteAudio')}
            disabled={isPending}
          >
            <Trash2Icon aria-hidden="true" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('book.deleteAudioTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('book.deleteAudioDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t('book.keepAudio')}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={onDelete}
          >
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2Icon aria-hidden="true" />
            )}
            {isPending ? t('book.audioDeleting') : t('book.deleteAudio')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getChapterAudioAction(
  chapter: ChapterSummaryResponseDto,
  t: ReturnType<typeof useTranslation>['t'],
  isPending: boolean,
  onQueue: () => void,
  onCancel: () => void,
) {
  if (canStopChapterAudio(chapter)) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={onCancel}
      >
        {isPending ? (
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        ) : (
          <CircleStopIcon aria-hidden="true" />
        )}
        {isPending ? t('book.audioStopping') : t('book.stopAudio')}
      </Button>
    );
  }

  if (
    chapter.audio &&
    (chapter.audio.status === 'FAILED' || chapter.audio.status === 'CANCELLED')
  ) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={onQueue}
      >
        {isPending ? (
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        ) : (
          <PlayIcon aria-hidden="true" />
        )}
        {isPending ? t('book.audioQueueing') : t('book.continueAudio')}
      </Button>
    );
  }

  return undefined;
}

function ChapterAudioStatus({
  audio,
  status,
  progress,
  voiceName,
  action,
}: {
  audio: ChapterAudioResponseDto;
  status: BookStatus;
  progress: number | undefined;
  voiceName: string | undefined;
  action?: ReactNode;
}) {
  const { t } = useTranslation();
  const isWorking =
    audio.status === 'PROCESSING' || audio.status === 'DELETING';
  const hasError = audio.status === 'FAILED';

  return (
    <div
      className={cn(
        'rounded-lg border bg-muted/40 px-3 py-2.5',
        hasError && 'border-destructive/30 bg-destructive/5',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isWorking ? (
            <LoaderCircleIcon
              className="size-4 shrink-0 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : (
            <AudioLinesIcon
              className={cn(
                'size-4 shrink-0 text-muted-foreground',
                hasError && 'text-destructive',
              )}
              aria-hidden="true"
            />
          )}
          <p className="truncate text-sm font-medium">{status.label}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {voiceName && (
            <Badge
              variant="outline"
              className="max-w-44 truncate font-normal text-muted-foreground"
              title={voiceName}
            >
              {t('book.audioVoice', { voice: voiceName })}
            </Badge>
          )}
          {progress !== undefined && (
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {progress}%
            </span>
          )}
          {action}
        </div>
      </div>

      {progress !== undefined && (
        <>
          <Progress
            value={progress}
            aria-label={status.label}
            className="mt-2 gap-0"
          />
          {audio.processingStage === 'GENERATING' && audio.totalChunks > 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t('book.audioChunkProgress', {
                completed: audio.completedChunks,
                total: audio.totalChunks,
              })}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function ChapterAudioControls({
  access,
  action,
}: {
  access: ReturnType<typeof useQuery<ChapterAudioAccessResponseDto>>;
  action?: ReactNode;
}) {
  const { t } = useTranslation();

  if (access.isPending) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
          {t('book.audioLoading')}
        </span>
        {action}
      </div>
    );
  }

  if (access.isError || !access.data) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-destructive" role="alert">
          {t(getApiErrorTranslationKey(access.error))}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => access.refetch()}
        >
          <RotateCcwIcon aria-hidden="true" />
          {t('common.retry')}
        </Button>
        {action}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <ChapterAudioPlayer
        src={access.data.playbackUrl}
        onError={() => {
          void access.refetch();
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="shrink-0"
        aria-label={t('book.downloadAudio')}
        title={t('book.downloadAudio')}
        render={
          <a href={access.data.downloadUrl}>
            <DownloadIcon aria-hidden="true" />
          </a>
        }
      />
      {action}
    </div>
  );
}

function ChapterAudioPlayer({
  src,
  onError,
}: {
  src: string;
  onError: () => void;
}) {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const canSeek = duration > 0;

  async function togglePlayback() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
  }

  function seek(value: number | readonly number[]) {
    const nextTime = Array.isArray(value) ? value[0] : value;
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(nextTime)) {
      return;
    }

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
      <Button
        type="button"
        size="icon-sm"
        className="size-8 shrink-0 rounded-full"
        aria-label={isPlaying ? t('book.pauseAudio') : t('book.playAudio')}
        onClick={() => {
          void togglePlayback();
        }}
      >
        {isPlaying ? (
          <PauseIcon aria-hidden="true" />
        ) : (
          <PlayIcon aria-hidden="true" />
        )}
      </Button>

      <div className="min-w-0 flex-1">
        <Slider
          min={0}
          max={duration || 1}
          value={[Math.min(currentTime, duration || 0)]}
          disabled={!canSeek}
          aria-label={t('book.audioSeek')}
          onValueChange={seek}
        />
        <div className="mt-1.5 flex items-center justify-between gap-3 text-xs tabular-nums text-muted-foreground">
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>

      <audio
        ref={audioRef}
        preload="metadata"
        className="hidden"
        src={src}
        onDurationChange={(event) => {
          const nextDuration = event.currentTarget.duration;
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setIsPlaying(false);
          onError();
        }}
        onPause={() => {
          setIsPlaying(false);
        }}
        onPlay={() => {
          setIsPlaying(true);
        }}
        onTimeUpdate={(event) => {
          setCurrentTime(event.currentTarget.currentTime);
        }}
      >
        {t('book.audioUnsupported')}
      </audio>
    </div>
  );
}

function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const remainingSeconds = totalSeconds % 60;
  const secondsLabel = String(remainingSeconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${secondsLabel}`;
  }

  return `${minutes}:${secondsLabel}`;
}

function BookMetadata({
  className,
  icon,
  label,
  value,
}: {
  className?: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 truncate font-medium" title={value}>
        {value}
      </dd>
    </div>
  );
}

function BookPageSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
      </div>
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <Skeleton className="h-5 w-1/2" />
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-18" />
        <Skeleton className="h-18" />
      </div>
    </div>
  );
}

function getBookStatus(
  status: BookDetailResponseDto['book']['parseStatus'],
  t: ReturnType<typeof useTranslation>['t'],
): BookStatus {
  switch (status) {
    case 'UPLOADING':
      return { label: t('library.statusUploading'), variant: 'secondary' };
    case 'QUEUED':
      return { label: t('library.statusQueued'), variant: 'secondary' };
    case 'PROCESSING':
      return { label: t('library.statusProcessing'), variant: 'outline' };
    case 'READY':
      return { label: t('library.statusReady'), variant: 'default' };
    case 'FAILED':
      return { label: t('library.statusFailed'), variant: 'destructive' };
  }
}

function getChaptersMessage(
  status: BookDetailResponseDto['book']['parseStatus'],
  t: ReturnType<typeof useTranslation>['t'],
): string {
  if (status === 'FAILED') {
    return t('book.chaptersFailed');
  }

  if (status === 'READY') {
    return t('book.noChapters');
  }

  return t('book.chaptersPending');
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

function getBatchQueueAction(
  chapters: ChapterSummaryResponseDto[],
): BatchQueueAction {
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
    case 'generate':
      return t('book.generateSelectedAudio');
  }
}

function shouldPollBook(book: BookDetailResponseDto | undefined): boolean {
  return (
    book?.book.parseStatus === 'QUEUED' ||
    book?.book.parseStatus === 'PROCESSING' ||
    book?.chapters.some(
      (chapter) =>
        chapter.audio?.status === 'QUEUED' ||
        chapter.audio?.status === 'PROCESSING' ||
        chapter.audio?.status === 'DELETING',
    ) === true
  );
}

function getAudioStatus(
  audio: ChapterAudioResponseDto | null,
  t: ReturnType<typeof useTranslation>['t'],
): BookStatus | undefined {
  if (!audio) {
    return undefined;
  }

  switch (audio.status) {
    case 'QUEUED':
      return { label: t('book.audioQueued'), variant: 'secondary' };
    case 'READY':
      return { label: t('book.audioReady'), variant: 'default' };
    case 'FAILED':
      return { label: t('book.audioFailed'), variant: 'destructive' };
    case 'CANCELLED':
      return { label: t('book.audioCancelled'), variant: 'secondary' };
    case 'DELETING':
      return { label: t('book.audioDeleting'), variant: 'outline' };
    case 'PROCESSING':
      return {
        label: getAudioStageLabel(audio.processingStage, t),
        variant: 'outline',
      };
  }
}

function getAudioStageLabel(
  stage: ChapterAudioResponseDto['processingStage'],
  t: ReturnType<typeof useTranslation>['t'],
): string {
  switch (stage) {
    case 'CHUNKING':
      return t('book.audioChunking');
    case 'GENERATING':
      return t('book.audioGenerating');
    case 'MERGING':
      return t('book.audioMerging');
    case 'UPLOADING':
      return t('book.audioUploading');
  }
}

function getAudioProgress(
  audio: ChapterAudioResponseDto | null,
): number | undefined {
  if (
    !audio ||
    audio.status === 'FAILED' ||
    audio.status === 'READY' ||
    audio.status === 'CANCELLED' ||
    audio.status === 'DELETING'
  ) {
    return undefined;
  }

  if (audio.status === 'QUEUED') {
    return 0;
  }

  switch (audio.processingStage) {
    case 'CHUNKING':
      return 5;
    case 'GENERATING':
      return audio.totalChunks === 0
        ? 5
        : 5 + Math.round((80 * audio.completedChunks) / audio.totalChunks);
    case 'MERGING':
      return 90;
    case 'UPLOADING':
      return 95;
  }
}

function formatFileSize(bytes: number, locale: string): string {
  const megabyte = 1024 * 1024;
  const [unit, value] =
    bytes >= megabyte
      ? (['megabyte', bytes / megabyte] as const)
      : (['kilobyte', bytes / 1024] as const);

  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit,
    unitDisplay: 'narrow',
    maximumFractionDigits: 1,
  }).format(value);
}
