import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AudioLinesIcon,
  BookOpenIcon,
  CircleStopIcon,
  DownloadIcon,
  FileTextIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
  Trash2Icon,
  UsersRoundIcon,
} from 'lucide-react';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerCancelSelectedChapterAudioMutation,
  booksControllerDeleteChapterAudioMutation,
  booksControllerGetBookCoverAccessOptions,
  booksControllerGetChapterAudioAccessOptions,
  booksControllerGetBookQueryKey,
  booksControllerGetBookOptions,
  booksControllerQueueSelectedChapterAudioMutation,
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { DataState } from '@/shared/ui/data-state';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';

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
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const status = getBookStatus(book.book.parseStatus, t);
  const authors = book.authors.map((author) => author.name).join(', ');
  const selectedChapters = book.chapters.filter((chapter) =>
    selectedChapterIds.includes(chapter.id),
  );
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

  function toggleChapterSelection(chapterId: string, selected: boolean) {
    setSelectedChapterIds((current) => {
      if (selected) {
        return current.includes(chapterId) ? current : [...current, chapterId];
      }

      return current.filter((id) => id !== chapterId);
    });
  }

  function selectAllChapters() {
    setSelectedChapterIds(book.chapters.map((chapter) => chapter.id));
  }

  function clearChapterSelection() {
    setSelectedChapterIds([]);
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4 sm:gap-6">
          {book.book.hasCover &&
            (coverQuery.data ? (
              <img
                src={coverQuery.data.coverUrl}
                alt={t('book.coverAlt', { title: book.book.title })}
                className="h-36 w-24 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10 sm:h-44 sm:w-30"
                onError={() => {
                  void coverQuery.refetch();
                }}
              />
            ) : (
              <div
                className="flex h-36 w-24 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-foreground/10 sm:h-44 sm:w-30"
                aria-hidden="true"
              >
                <BookOpenIcon className="size-7" />
              </div>
            ))}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
              {book.book.title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {authors || t('book.unknownAuthor')}
            </p>
          </div>
        </div>
        <Badge variant={status.variant} className="w-fit shrink-0">
          {status.label}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon aria-hidden="true" />
            {book.book.sourceOriginalFilename}
          </CardTitle>
          <CardDescription>{book.book.sourceFormat}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 text-sm sm:grid-cols-3">
            <BookMetadata
              label={t('book.authors')}
              value={authors || t('book.unknownAuthor')}
              icon={<UsersRoundIcon aria-hidden="true" />}
            />
            <BookMetadata
              label={t('book.fileSize')}
              value={formatFileSize(book.book.sourceSize, i18n.language)}
              icon={<FileTextIcon aria-hidden="true" />}
            />
            <BookMetadata
              label={t('book.chaptersTitle')}
              value={t('library.chapterCount', {
                count: book.book.chapterCount,
              })}
              icon={<BookOpenIcon aria-hidden="true" />}
            />
          </dl>
        </CardContent>
      </Card>

      <section aria-labelledby="chapters-title">
        <div className="flex items-center justify-between gap-4">
          <h2 id="chapters-title" className="text-xl font-semibold">
            {t('book.chaptersTitle')}
          </h2>
          <span className="text-sm text-muted-foreground">
            {t('library.chapterCount', { count: book.chapters.length })}
          </span>
        </div>

        {book.chapters.length > 0 ? (
          <>
            <ChapterBatchActions
              totalChapters={book.chapters.length}
              selectedChapterCount={selectedChapters.length}
              queueableChapterCount={queueableChapterIds.length}
              stoppableChapterCount={stoppableChapterIds.length}
              queueAction={batchQueueAction}
              isAllSelected={selectedChapters.length === book.chapters.length}
              isPending={isBatchActionPending}
              error={batchActionError}
              onSelectAll={selectAllChapters}
              onClearSelection={clearChapterSelection}
              onQueue={queueSelectedChapters}
              onCancel={cancelSelectedChapters}
            />

            <ol className="mt-4 space-y-3">
              {book.chapters.map((chapter) => (
                <li key={chapter.id}>
                  <ChapterCard
                    bookId={book.book.id}
                    chapter={chapter}
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
          <Card className="mt-4">
            <CardContent className="text-muted-foreground">
              {getChaptersMessage(book.book.parseStatus, t)}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function ChapterBatchActions({
  totalChapters,
  selectedChapterCount,
  queueableChapterCount,
  stoppableChapterCount,
  queueAction,
  isAllSelected,
  isPending,
  error,
  onSelectAll,
  onClearSelection,
  onQueue,
  onCancel,
}: {
  totalChapters: number;
  selectedChapterCount: number;
  queueableChapterCount: number;
  stoppableChapterCount: number;
  queueAction: BatchQueueAction;
  isAllSelected: boolean;
  isPending: boolean;
  error: unknown;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onQueue: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const generateLabel = getBatchQueueLabel(queueAction, t);

  return (
    <Card className="mt-4" size="sm">
      <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-medium">{t('book.chapterSelection')}</p>
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            {t('book.chaptersSelected', { count: selectedChapterCount })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isAllSelected ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={onClearSelection}
            >
              {t('book.clearChapterSelection')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={onSelectAll}
            >
              {t('book.selectAllChapters', { count: totalChapters })}
            </Button>
          )}
          <Button
            type="button"
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
          <Button
            type="button"
            variant="outline"
            disabled={stoppableChapterCount === 0 || isPending}
            onClick={onCancel}
          >
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : (
              <CircleStopIcon aria-hidden="true" />
            )}
            {isPending ? t('book.audioStopping') : t('book.stopSelectedAudio')}
          </Button>
        </div>
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

function ChapterCard({
  bookId,
  chapter,
  isSelected,
  onSelectionChange,
}: {
  bookId: string;
  chapter: ChapterSummaryResponseDto;
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
  const mutationError = deleteAudio.error;

  function deleteChapterAudio() {
    deleteAudio.mutate({ path: { bookId, chapterId: chapter.id } });
  }

  async function invalidateBook() {
    await queryClient.invalidateQueries({
      queryKey: booksControllerGetBookQueryKey({ path: { bookId } }),
    });
  }

  return (
    <Card size="sm" className={isSelected ? 'ring-2 ring-primary' : undefined}>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Checkbox
            checked={isSelected}
            aria-label={t('book.selectChapter', { title: chapter.title })}
            onCheckedChange={(checked) => onSelectionChange(checked === true)}
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {t('book.chapterNumber', { number: chapter.position + 1 })}
            </p>
            <h3 className="mt-1 truncate font-medium">{chapter.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('book.wordCount', { count: chapter.wordCount })}
            </p>

            {audioStatus && (
              <div className="mt-3 space-y-2">
                <Badge variant={audioStatus.variant}>{audioStatus.label}</Badge>
                {progress !== undefined && (
                  <div className="max-w-xs space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{audioStatus.label}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} aria-label={audioStatus.label} />
                    {chapter.audio?.processingStage === 'GENERATING' &&
                      chapter.audio.totalChunks > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {t('book.audioChunkProgress', {
                            completed: chapter.audio.completedChunks,
                            total: chapter.audio.totalChunks,
                          })}
                        </p>
                      )}
                  </div>
                )}
              </div>
            )}

            {mutationError && (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {t(getApiErrorTranslationKey(mutationError))}
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {chapter.audio && !isDeleting && (
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1 sm:flex-none"
                    disabled={deleteAudio.isPending}
                  >
                    <Trash2Icon aria-hidden="true" />
                    {t('book.deleteAudio')}
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t('book.deleteAudioTitle')}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('book.deleteAudioDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteAudio.isPending}>
                    {t('book.keepAudio')}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    type="button"
                    variant="destructive"
                    disabled={deleteAudio.isPending}
                    onClick={deleteChapterAudio}
                  >
                    {deleteAudio.isPending ? (
                      <LoaderCircleIcon
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Trash2Icon aria-hidden="true" />
                    )}
                    {deleteAudio.isPending
                      ? t('book.audioDeleting')
                      : t('book.deleteAudio')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>

      {chapter.audio?.status === 'READY' && (
        <CardContent className="border-t pt-4">
          <ChapterAudioControls access={audioAccess} />
        </CardContent>
      )}
    </Card>
  );
}

function ChapterAudioControls({
  access,
}: {
  access: ReturnType<typeof useQuery<ChapterAudioAccessResponseDto>>;
}) {
  const { t } = useTranslation();

  if (access.isPending) {
    return (
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        {t('book.audioLoading')}
      </span>
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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <audio
        controls
        preload="metadata"
        className="h-9 w-full min-w-0 sm:max-w-md"
        src={access.data.playbackUrl}
        onError={() => {
          void access.refetch();
        }}
      >
        {t('book.audioUnsupported')}
      </audio>
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        render={
          <a href={access.data.downloadUrl}>
            <DownloadIcon aria-hidden="true" />
            {t('book.downloadAudio')}
          </a>
        }
      />
    </div>
  );
}

function BookMetadata({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
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
