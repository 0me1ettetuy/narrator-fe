import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AudioLinesIcon,
  BookOpenIcon,
  FileTextIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
  UsersRoundIcon,
} from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetBookQueryKey,
  booksControllerGetBookOptions,
  booksControllerQueueChapterAudioMutation,
  type BookDetailResponseDto,
  type ChapterAudioResponseDto,
  type ChapterSummaryResponseDto,
  getApiErrorTranslationKey,
} from '@/shared/api';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
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
  const status = getBookStatus(book.book.parseStatus, t);
  const authors = book.authors.map((author) => author.name).join(', ');

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {book.book.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {authors || t('book.unknownAuthor')}
          </p>
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
          <ol className="mt-4 space-y-3">
            {book.chapters.map((chapter) => (
              <li key={chapter.id}>
                <ChapterCard bookId={book.book.id} chapter={chapter} />
              </li>
            ))}
          </ol>
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

function ChapterCard({
  bookId,
  chapter,
}: {
  bookId: string;
  chapter: ChapterSummaryResponseDto;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const queueAudio = useMutation({
    ...booksControllerQueueChapterAudioMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: booksControllerGetBookQueryKey({ path: { bookId } }),
      });
    },
  });
  const audioStatus = getAudioStatus(chapter.audio, t);
  const progress = getAudioProgress(chapter.audio);
  const canQueue = !chapter.audio || chapter.audio.status === 'FAILED';
  const isWorking =
    queueAudio.isPending ||
    chapter.audio?.status === 'QUEUED' ||
    chapter.audio?.status === 'PROCESSING';

  function queueChapterAudio() {
    queueAudio.mutate({ path: { bookId, chapterId: chapter.id } });
  }

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

          {queueAudio.isError && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {t(getApiErrorTranslationKey(queueAudio.error))}
            </p>
          )}
        </div>

        {canQueue && (
          <Button
            type="button"
            variant={chapter.audio?.status === 'FAILED' ? 'outline' : 'default'}
            className="w-full sm:w-auto"
            disabled={queueAudio.isPending}
            onClick={queueChapterAudio}
          >
            {queueAudio.isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : chapter.audio?.status === 'FAILED' ? (
              <RotateCcwIcon aria-hidden="true" />
            ) : (
              <AudioLinesIcon aria-hidden="true" />
            )}
            {queueAudio.isPending
              ? t('book.audioQueueing')
              : chapter.audio?.status === 'FAILED'
                ? t('book.retryAudio')
                : t('book.generateAudio')}
          </Button>
        )}

        {isWorking && !canQueue && (
          <span className="text-sm text-muted-foreground">
            {t('book.audioInProgress')}
          </span>
        )}
      </CardContent>
    </Card>
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

function shouldPollBook(book: BookDetailResponseDto | undefined): boolean {
  return (
    book?.book.parseStatus === 'QUEUED' ||
    book?.book.parseStatus === 'PROCESSING' ||
    book?.chapters.some(
      (chapter) =>
        chapter.audio?.status === 'QUEUED' ||
        chapter.audio?.status === 'PROCESSING',
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
  if (!audio || audio.status === 'FAILED' || audio.status === 'READY') {
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
