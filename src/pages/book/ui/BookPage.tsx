import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AudioLinesIcon,
  BookmarkCheckIcon,
  BookmarkPlusIcon,
  BookOpenIcon,
  CheckIcon,
  CopyIcon,
  GlobeIcon,
  ListChecksIcon,
  LoaderCircleIcon,
  LockIcon,
} from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState, type ComponentProps, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { shouldPollBook, useCoverColor } from '@/entities/book';
import {
  booksControllerAddToLibraryMutation,
  booksControllerCopyBookMutation,
  booksControllerGetBookCoverAccessOptions,
  booksControllerGetBookQueryKey,
  booksControllerGetBookOptions,
  booksControllerListBooksQueryKey,
  booksControllerRemoveFromLibraryMutation,
  type BookDetailResponseDto,
  type ChapterSummaryResponseDto,
  getApiErrorTranslationKey,
} from '@/shared/api';
import { PlayBookButton } from '@/features/audio-player';
import { ChapterNarration } from '@/widgets/chapter-narration';
import {
  AddToCollectionDialog,
  BookActionsMenu,
} from '@/widgets/book-actions-menu';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { DataState } from '@/shared/ui/data-state';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';
import { toast } from '@/shared/ui/toast';
import { BookCoverEditor } from './BookCoverEditor';
import { BookCoverViewer } from './BookCoverViewer';

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
  // A book someone else made public is read-only: no selection, generation,
  // deletion, or cover edits. Only its owner can change it.
  const canEdit = book.book.isOwner;
  // Listen (default): chapters with the player. Narrate: selection, generation
  // and menus, no player. Owner only; same page, switched by a button.
  const [isNarrating, setIsNarrating] = useState(false);
  const isEditing = canEdit && isNarrating;
  const status = getBookStatus(book.book.parseStatus, t);
  const authors = book.authors.map((author) => author.name).join(', ');
  const coverQuery = useQuery({
    ...booksControllerGetBookCoverAccessOptions({
      path: { bookId: book.book.id },
    }),
    enabled: book.book.hasCover,
    staleTime: 14 * 60 * 1_000,
  });
  return (
    <div className="space-y-16">
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

        {book.chapters.length > 0 ? (
          <ChapterNarration
            bookId={book.book.id}
            language={book.book.language}
            chapters={book.chapters}
            isEditing={isEditing}
          />
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
  const navigate = useNavigate();
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
                <BookActionsMenu
                  book={book}
                  onDeleted={() => navigate({ to: '/library' })}
                />
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
