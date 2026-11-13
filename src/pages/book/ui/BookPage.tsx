import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AudioLinesIcon,
  BookmarkCheckIcon,
  BookmarkPlusIcon,
  BookOpenIcon,
  CheckIcon,
  CircleAlertIcon,
  CircleStopIcon,
  CopyIcon,
  EllipsisIcon,
  FolderPlusIcon,
  GlobeIcon,
  ListChecksIcon,
  LoaderCircleIcon,
  LockIcon,
  RotateCcwIcon,
  Trash2Icon,
} from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState, type ComponentProps, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useCoverColor } from '@/entities/book';
import { DeleteBookButton } from '@/features/delete-book';
import { AddToCollectionDialog } from './AddToCollectionDialog';
import {
  booksControllerAddToLibraryMutation,
  booksControllerCancelSelectedChapterAudioMutation,
  booksControllerCopyBookMutation,
  booksControllerGetBookCoverAccessOptions,
  booksControllerGetBookQueryKey,
  booksControllerGetBookOptions,
  booksControllerListBooksQueryKey,
  booksControllerQueueSelectedChapterAudioMutation,
  booksControllerRemoveFromLibraryMutation,
  booksControllerUpdateVisibilityMutation,
  ttsModelsControllerListModelsOptions,
  type BookDetailResponseDto,
  type ChapterSummaryResponseDto,
  type TtsModelsResponseDto,
  getApiErrorTranslationKey,
} from '@/shared/api';
import { PlayBookButton } from '@/features/audio-player';
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
import { Field, FieldLabel } from '@/shared/ui/field';
import { Separator } from '@/shared/ui/separator';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Card, CardContent } from '@/shared/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { DataState } from '@/shared/ui/data-state';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';
import { toast } from '@/shared/ui/toast';
import { BookCoverEditor } from './BookCoverEditor';
import { BookCoverViewer } from './BookCoverViewer';
import { ChapterRow } from './ChapterRow';
import { useLocalVoice, type LocalVoiceSelection } from '../model/local-voice';
import { getTtsSelection } from '../model/tts-selection';
import { TtsSelector } from './TtsSelector';

type BookPageProps = {
  bookId: string;
};

type BookStatus = {
  label: string;
  variant: ComponentProps<typeof Badge>['variant'];
};

type BatchQueueAction =
  'generate' | 'continue' | 'generateOrContinue' | 'regenerate';

export function BookPage({ bookId }: BookPageProps) {
  const bookOptions = { path: { bookId } };
  const bookQuery = useQuery({
    ...booksControllerGetBookOptions(bookOptions),
    refetchInterval: (query) =>
      shouldPollBook(query.state.data) ? 1_000 : false,
  });

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
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
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);
  // A book someone else made public is read-only: no selection, generation,
  // deletion, or cover edits. Only its owner can change it.
  const canEdit = book.book.isOwner;
  // Listen (default): chapters with the player. Narrate: selection, generation
  // and menus, no player. Owner only; same page, switched by a button.
  const [isNarrating, setIsNarrating] = useState(false);
  const isEditing = canEdit && isNarrating;
  const status = getBookStatus(book.book.parseStatus, t);
  const authors = book.authors.map((author) => author.name).join(', ');
  // Chapters tagged "not narrated" are skipped by generation, so they can't be selected.
  const selectableChapters = book.chapters.filter(
    (chapter) => chapter.includeInDefaultNarration,
  );
  const selectedChapters = selectableChapters.filter((chapter) =>
    selectedChapterIds.includes(chapter.id),
  );
  // Narrated-chapters quick select hidden; see
  // docs/issues/chapter-tags-and-narrated-selector-hidden.md.
  // const narratedChapterIds = book.chapters
  //   .filter((chapter) => chapter.includeInDefaultNarration)
  //   .map((chapter) => chapter.id);
  // const selectedNarratedChapterCount = book.chapters.filter(
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
  const ttsSelection = getTtsSelection(modelsQuery.data);
  const canQueueAudio = ttsSelection.isComplete;
  const localVoice = useLocalVoice(
    ttsSelection.selectedModel,
    book.book.language,
  );

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
  //     return book.chapters
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
      path: { bookId: book.book.id },
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
        chapters={book.chapters}
        authors={authors || t('book.unknownAuthor')}
        status={status}
        showPlay={!isEditing}
        coverUrl={coverQuery.data?.coverUrl}
        onCoverError={() => {
          void coverQuery.refetch();
        }}
      />

      <section aria-labelledby="chapters-title">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3.5 gap-y-1 pb-4">
          <div className="flex items-baseline gap-3.5">
            <h2
              id="chapters-title"
              className="text-[32px] leading-none font-medium tracking-[-0.02em]"
            >
              {t('book.chaptersTitle')}
            </h2>
            <span className="text-sm text-muted-foreground">
              {t('library.chapterCount', { count: book.chapters.length })}
            </span>
          </div>
          {book.chapters.length > 0 && canEdit && (
            <div className="flex items-center gap-1 max-sm:-ml-2.5">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    render={
                      <Link
                        to="/library/$bookId/reorganize"
                        params={{ bookId: book.book.id }}
                      />
                    }
                  >
                    <ListChecksIcon aria-hidden="true" />
                    {t('book.reorganizeChapters')}
                  </Button>
                  <Button size="sm" onClick={() => setIsNarrating(false)}>
                    <CheckIcon aria-hidden="true" />
                    {t('common.done')}
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsNarrating(true)}
                >
                  <AudioLinesIcon aria-hidden="true" />
                  {t('book.narrateChapters')}
                </Button>
              )}
            </div>
          )}
        </div>

        {book.chapters.length > 0 && isEditing && (
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
            everyChapterLabel={t(nextEverySelection.labelKey)}
            onEveryChapterSelectionChange={() =>
              setSelectedChapterIds(nextEverySelection.ids)
            }
            onQueue={requestQueue}
            onCancel={cancelSelectedChapters}
          />
        )}

        {book.chapters.length > 0 ? (
          <ol>
            {book.chapters.map((chapter) => (
              <ChapterRow
                key={chapter.id}
                bookId={book.book.id}
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
        ) : (
          <Card className="mt-3">
            <CardContent className="text-muted-foreground">
              {getChaptersMessage(book.book.parseStatus, t)}
            </CardContent>
          </Card>
        )}
      </section>

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
    </div>
  );
}

function BookOverview({
  book,
  chapters,
  authors,
  status,
  showPlay,
  coverUrl,
  onCoverError,
}: {
  book: BookDetailResponseDto['book'];
  chapters: ChapterSummaryResponseDto[];
  authors: string;
  status: BookStatus;
  showPlay: boolean;
  coverUrl: string | undefined;
  onCoverError: () => void;
}) {
  const { t, i18n } = useTranslation();
  const cover = useCoverColor(book.hasCover ? coverUrl : undefined);

  const hasReadyAudio =
    book.parseStatus === 'READY' &&
    chapters.some((chapter) => chapter.audio?.status === 'READY');
  const playButton =
    showPlay && hasReadyAudio ? <PlayBookButton bookId={book.id} /> : null;

  return (
    <section
      aria-labelledby="book-title"
      className="flex flex-wrap items-stretch gap-x-11 gap-y-8"
    >
      <div className="group/cover relative mx-auto aspect-[2/3] w-55 shrink-0 self-start overflow-hidden bg-foreground shadow-[0_18px_40px_-22px_rgba(0,0,0,0.55)] sm:mx-0">
        {book.hasCover && coverUrl ? (
          <BookCoverViewer
            title={book.title}
            url={coverUrl}
            onImageError={onCoverError}
          />
        ) : (
          <div
            className="flex size-full items-center justify-center bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            <BookOpenIcon className="size-8" />
          </div>
        )}
        <span
          className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-[3px]"
          aria-hidden="true"
          style={
            { '--accent': cover?.background ?? 'var(--brand)' } as CSSProperties
          }
        >
          <span className="basis-[30%] bg-[color-mix(in_srgb,var(--accent)_65%,black)]" />
          <span className="flex-1 bg-(--accent)" />
        </span>
        {book.isOwner && (
          <BookCoverEditor
            bookId={book.id}
            bookTitle={book.title}
            disabled={book.parseStatus !== 'READY'}
            hasCover={book.hasCover}
            className="absolute top-3 right-2 z-10 bg-card transition-opacity focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/cover:opacity-100"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-[1_1_30rem] flex-col gap-5.5">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-4">
            <span className="min-w-0 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              {authors}
            </span>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {playButton}
              {book.isOwner ? (
                <BookActionsMenu book={book} />
              ) : (
                <>
                  <AddToCollectionDialog book={book} />
                  <LibraryMembershipButton book={book} />
                  <CopyBookButton bookId={book.id} />
                </>
              )}
            </div>
          </div>
          <h1
            id="book-title"
            className="font-serif text-3xl leading-[1.04] font-medium tracking-[-0.02em] break-words sm:text-[46px]"
          >
            {book.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="outline">{book.sourceFormat}</Badge>
            <Badge variant="outline">
              {book.visibility === 'PUBLIC' ? (
                <>
                  <GlobeIcon aria-hidden="true" />
                  {t('book.publicBadge')}
                </>
              ) : (
                <>
                  <LockIcon aria-hidden="true" />
                  {t('collection.privateBadge')}
                </>
              )}
            </Badge>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-y-4 border-y py-4 sm:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <BookMetadata
            label={t('book.fileName')}
            value={book.sourceOriginalFilename}
          />
          <BookMetadata
            label={t('book.fileSize')}
            value={formatFileSize(book.sourceSize, i18n.language)}
          />
          {book.language && (
            <BookMetadata
              label={t('book.language')}
              value={getLanguageName(book.language, i18n.language)}
            />
          )}
          <BookMetadata
            label={t('book.chaptersTitle')}
            value={String(book.chapterCount)}
          />
        </dl>

        <BookAudioSummary chapters={chapters} />
      </div>
    </section>
  );
}

// Owner actions behind one menu; each opens its own dialog, controlled here.
function BookActionsMenu({ book }: { book: BookDetailResponseDto['book'] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<
    'collection' | 'public' | 'delete' | null
  >(null);
  const makePrivate = useMutation({
    ...booksControllerUpdateVisibilityMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: booksControllerGetBookQueryKey({ path: { bookId: book.id } }),
      });
    },
    onError: (error) => {
      toast.add({
        title: t(getApiErrorTranslationKey(error)),
        type: 'error',
        priority: 'high',
      });
    },
  });
  const label = t('book.actions');

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              aria-label={label}
              title={label}
            />
          }
        >
          <EllipsisIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-58">
          <DropdownMenuItem onClick={() => setDialog('collection')}>
            <FolderPlusIcon aria-hidden="true" />
            {t('collection.addToCollection')}
          </DropdownMenuItem>
          {book.visibility === 'PUBLIC' ? (
            <DropdownMenuItem
              disabled={makePrivate.isPending}
              onClick={() =>
                makePrivate.mutate({
                  path: { bookId: book.id },
                  body: { visibility: 'PRIVATE' },
                })
              }
            >
              <LockIcon aria-hidden="true" />
              {t('book.makePrivate')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={book.parseStatus !== 'READY'}
              onClick={() => setDialog('public')}
            >
              <GlobeIcon aria-hidden="true" />
              {t('book.makePublic')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDialog('delete')}
          >
            <Trash2Icon aria-hidden="true" />
            {t('book.deleteBook')}…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AddToCollectionDialog
        book={book}
        open={dialog === 'collection'}
        onOpenChange={(open) => setDialog(open ? 'collection' : null)}
      />
      <MakePublicDialog
        book={book}
        open={dialog === 'public'}
        onOpenChange={(open) => setDialog(open ? 'public' : null)}
      />
      <DeleteBookButton
        bookId={book.id}
        bookTitle={book.title}
        variant="none"
        open={dialog === 'delete'}
        onOpenChange={(open) => setDialog(open ? 'delete' : null)}
        onDeleted={() => navigate({ to: '/library' })}
      />
    </>
  );
}

// Making a book public exposes it to every signed-in user, so this direction
// asks for confirmation; reverting to private does not.
function MakePublicDialog({
  book,
  open,
  onOpenChange,
}: {
  book: BookDetailResponseDto['book'];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const updateVisibility = useMutation({
    ...booksControllerUpdateVisibilityMutation(),
    onSuccess: async () => {
      onOpenChange(false);
      await queryClient.invalidateQueries({
        queryKey: booksControllerGetBookQueryKey({ path: { bookId: book.id } }),
      });
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!updateVisibility.isPending) {
          updateVisibility.reset();
          onOpenChange(next);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <GlobeIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('book.makePublicTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('book.makePublicDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {updateVisibility.error && (
          <p className="text-sm text-destructive" role="alert">
            {t(getApiErrorTranslationKey(updateVisibility.error))}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={updateVisibility.isPending}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={updateVisibility.isPending}
            onClick={() =>
              updateVisibility.mutate({
                path: { bookId: book.id },
                body: { visibility: 'PUBLIC' },
              })
            }
          >
            {updateVisibility.isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : (
              <GlobeIcon aria-hidden="true" />
            )}
            {t('book.makePublic')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Segmented bar of the narrated chapters' audio: ready, in progress, failed.
// Chapters tagged "not narrated" are outside the bar and only counted.
function BookAudioSummary({
  chapters,
}: {
  chapters: ChapterSummaryResponseDto[];
}) {
  const { t } = useTranslation();
  const narrated = chapters.filter(
    (chapter) => chapter.includeInDefaultNarration,
  );

  if (narrated.length === 0) {
    return null;
  }

  const countWith = (...statuses: string[]) =>
    narrated.filter(
      (chapter) => chapter.audio && statuses.includes(chapter.audio.status),
    ).length;
  const ready = countWith('READY');
  const inProgress = countWith('QUEUED', 'PROCESSING', 'DELETING');
  const failed = countWith('FAILED');
  const without = narrated.length - ready - inProgress - failed;
  const notNarrated = chapters.length - narrated.length;
  const segments = [
    { n: ready, swatch: 'bg-foreground', label: 'book.audioLegendReady' },
    { n: inProgress, swatch: 'bg-brand', label: 'book.audioLegendInProgress' },
    { n: failed, swatch: 'bg-destructive', label: 'book.audioLegendAttention' },
  ].filter((segment) => segment.n > 0);
  const rest = [
    without > 0 ? t('book.audioLegendWithout', { n: without }) : null,
    notNarrated > 0
      ? t('book.audioLegendNotNarrated', { n: notNarrated })
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      role="group"
      aria-label={t('book.audioLabel')}
      className="mt-auto flex flex-col gap-2.5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {t('book.audioLabel')}
        </span>
        <span className="font-serif text-sm" aria-live="polite">
          {t('book.audioSummary', { ready, total: narrated.length })}
        </span>
      </div>
      <div className="flex h-2 gap-0.5 bg-secondary" aria-hidden="true">
        {segments.map((segment) => (
          <span
            key={segment.label}
            className={segment.swatch}
            style={{ flexBasis: `${(segment.n / narrated.length) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4.5 gap-y-1.5 text-[13px] text-muted-foreground">
        {segments.map((segment) => (
          <span
            key={segment.label}
            className="inline-flex items-center gap-1.5"
          >
            <span className={cn('size-2', segment.swatch)} aria-hidden="true" />
            {t(segment.label, { n: segment.n })}
          </span>
        ))}
        {rest && <span>{rest}</span>}
      </div>
    </div>
  );
}

function getLanguageName(code: string, locale: string): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: 'language' }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

function LibraryMembershipButton({
  book,
}: {
  book: BookDetailResponseDto['book'];
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const addToLibrary = useMutation({
    ...booksControllerAddToLibraryMutation(),
    onSuccess: invalidate,
  });
  const removeFromLibrary = useMutation({
    ...booksControllerRemoveFromLibraryMutation(),
    onSuccess: invalidate,
  });
  const isPending = addToLibrary.isPending || removeFromLibrary.isPending;
  const error = addToLibrary.error ?? removeFromLibrary.error;

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: booksControllerGetBookQueryKey({ path: { bookId: book.id } }),
      }),
      queryClient.invalidateQueries({
        queryKey: booksControllerListBooksQueryKey(),
      }),
    ]);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          removeFromLibrary.reset();
          addToLibrary.reset();

          if (book.isAdded) {
            removeFromLibrary.mutate({ path: { bookId: book.id } });
          } else {
            addToLibrary.mutate({ path: { bookId: book.id } });
          }
        }}
      >
        {isPending ? (
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        ) : book.isAdded ? (
          <BookmarkCheckIcon aria-hidden="true" />
        ) : (
          <BookmarkPlusIcon aria-hidden="true" />
        )}
        {book.isAdded ? t('book.removeFromLibrary') : t('book.addToLibrary')}
      </Button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {t(getApiErrorTranslationKey(error))}
        </p>
      )}
    </div>
  );
}

function CopyBookButton({ bookId }: { bookId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const copyBook = useMutation({
    ...booksControllerCopyBookMutation(),
    onSuccess: async (result) => {
      toast.add({ title: t('book.bookCopied'), type: 'success' });
      await navigate({
        to: '/library/$bookId',
        params: { bookId: result.bookId },
      });
    },
    onError: (error) => {
      toast.add({
        title: t('book.copyBookFailed'),
        description: t(getApiErrorTranslationKey(error)),
        type: 'error',
        priority: 'high',
      });
    },
  });

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={copyBook.isPending}
      onClick={() => copyBook.mutate({ path: { bookId } })}
    >
      {copyBook.isPending ? (
        <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
      ) : (
        <CopyIcon aria-hidden="true" />
      )}
      {t('book.makeACopy')}
    </Button>
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
      className="sticky top-14 z-10 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-foreground bg-background px-4 py-3"
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

function BookMetadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 sm:border-l sm:pl-5 sm:first:border-l-0 sm:first:pl-0">
      <dt className="text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="truncate text-[15px] font-medium" title={value}>
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
      <div className="bg-card p-4 ring-1 ring-foreground/10">
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
