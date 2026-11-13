import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  LoaderCircleIcon,
  PlayIcon,
  SquareIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookCoverThumb,
  getAudioProgress,
  getAudioStageLabel,
} from '@/entities/book';
import {
  booksControllerCancelSelectedChapterAudioMutation,
  booksControllerGetBookQueryKey,
  booksControllerListActiveAudioQueryKey,
  booksControllerQueueSelectedChapterAudioMutation,
  getApiErrorTranslationKey,
} from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { toast } from '@/shared/ui/toast';
import { confirmPaused, dropPaused, pauseBook } from '../model/paused-books';
import type { ActiveBook } from '../model/use-active-audio';

const progressStyle =
  'gap-0 [&_[data-slot=progress-track]]:bg-background/25 [&_[data-slot=progress-indicator]]:bg-background';
const outline =
  'border-background/25 text-background hover:bg-background/10 hover:text-background';

// The island row for audio generation: one book as a single row, several as a
// summary with a toggleable per-book queue. A running book has Stop; a stopped
// one stays with Continue until it runs again. Stop all covers running books.
export function GenerationItem({ books }: { books: ActiveBook[] }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const refresh = (bookId: string) =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: booksControllerListActiveAudioQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: booksControllerGetBookQueryKey({ path: { bookId } }),
      }),
    ]);
  const onError = (error: unknown) =>
    toast.add({ title: t(getApiErrorTranslationKey(error)), type: 'error' });
  const stop = useMutation({
    ...booksControllerCancelSelectedChapterAudioMutation(),
    onSuccess: async (_data, variables) => {
      await refresh(String(variables.path.bookId));
      confirmPaused(String(variables.path.bookId));
    },
    onError: (error, variables) => {
      dropPaused(String(variables.path.bookId));
      onError(error);
    },
  });
  const resume = useMutation({
    ...booksControllerQueueSelectedChapterAudioMutation(),
    onSuccess: async (_data, variables) => {
      await refresh(String(variables.path.bookId));
      dropPaused(String(variables.path.bookId));
    },
    onError,
  });
  const chapterIds = (book: ActiveBook) =>
    book.chapters.map((chapter) => chapter.id);
  // The snapshot is kept before the request so the row survives a poll that
  // lands between the stop and its confirmation.
  const stopBook = (book: ActiveBook) => {
    pauseBook(book);
    stop.mutate({
      path: { bookId: book.bookId },
      body: { chapterIds: chapterIds(book) },
    });
  };
  const resumeBook = (book: ActiveBook) =>
    resume.mutate({
      path: { bookId: book.bookId },
      body: { chapterIds: chapterIds(book) },
    });
  const action = (
    label: string,
    icon: ReactNode,
    pending: boolean,
    onClick: () => void,
  ) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={outline}
      disabled={pending}
      onClick={onClick}
    >
      {pending ? (
        <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      {label}
    </Button>
  );
  const row = (book: ActiveBook) => (
    <BookRow
      key={book.bookId}
      book={book}
      action={
        book.isPaused
          ? action(
              t('book.resumeAudio'),
              <PlayIcon aria-hidden="true" />,
              resume.isPending,
              () => resumeBook(book),
            )
          : action(
              t('book.stopAudio'),
              <SquareIcon aria-hidden="true" />,
              stop.isPending,
              () => stopBook(book),
            )
      }
    />
  );

  if (books.length === 1) {
    return (
      <div role="region" aria-label={t('generation.region')}>
        {row(books[0])}
      </div>
    );
  }

  const running = books.filter((book) => !book.isPaused);
  const chapters = books.flatMap((book) => book.chapters);
  const percent = Math.round(
    chapters.reduce(
      (sum, chapter) => sum + (getAudioProgress(chapter.audio) ?? 0),
      0,
    ) / chapters.length,
  );
  const now = running
    .filter((book) =>
      book.chapters.some((chapter) => chapter.audio.status === 'PROCESSING'),
    )
    .map((book) => book.title)
    .join(', ');
  const toggleLabel = t(
    isOpen ? 'generation.hideQueue' : 'generation.showQueue',
  );

  return (
    <div role="region" aria-label={t('generation.region')}>
      {isOpen && (
        <ul
          aria-label={t('generation.region')}
          className="divide-y divide-background/20 border-b border-background/20"
        >
          {books.map((book) => (
            <li key={book.bookId}>{row(book)}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3 px-4 py-3 sm:flex-nowrap">
        <span aria-hidden="true" className="flex shrink-0">
          {books.slice(0, 3).map((book, index) => (
            <BookCoverThumb
              key={book.bookId}
              bookId={book.bookId}
              hasCover={book.hasCover}
              className={index > 0 ? '-ml-7 ring-2 ring-foreground' : undefined}
            />
          ))}
        </span>
        <div className="flex min-w-0 flex-[1_1_8rem] flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-[10px] font-semibold tracking-[0.08em] uppercase opacity-65">
              {running.length > 0
                ? t('generation.generating')
                : t('book.audioCancelled')}{' '}
              · {t('library.bookCount', { count: books.length })} ·{' '}
              {t('library.chapterCount', { count: chapters.length })}
            </span>
            <span className="shrink-0 text-xs tabular-nums opacity-65">
              {percent}%
            </span>
          </div>
          <Progress
            value={percent}
            aria-label={t('generation.generating')}
            className={progressStyle}
          />
          {now && (
            <span className="truncate font-serif text-[13px] opacity-65">
              {t('generation.now', { titles: now })}
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={outline}
            aria-expanded={isOpen}
            aria-label={toggleLabel}
            title={toggleLabel}
            onClick={() => setIsOpen((open) => !open)}
          >
            {isOpen ? (
              <ChevronDownIcon aria-hidden="true" />
            ) : (
              <ChevronUpIcon aria-hidden="true" />
            )}
          </Button>
          {running.length > 0 &&
            action(
              t('generation.stopAll'),
              <SquareIcon aria-hidden="true" />,
              stop.isPending,
              () => running.forEach(stopBook),
            )}
        </div>
      </div>
    </div>
  );
}

function BookRow({ book, action }: { book: ActiveBook; action: ReactNode }) {
  const { t } = useTranslation();
  const current =
    book.chapters.find((chapter) => chapter.audio.status === 'PROCESSING') ??
    book.chapters[0];
  const audio = current.audio;
  const stage = book.isPaused
    ? t('book.audioCancelled')
    : audio.status === 'PROCESSING' && audio.processingStage
      ? getAudioStageLabel(audio.processingStage, t)
      : t('book.audioQueued');
  const more = book.chapters.length - 1;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-3 px-4 py-3 sm:flex-nowrap">
      <BookCoverThumb bookId={book.bookId} hasCover={book.hasCover} />
      <div className="flex min-w-0 flex-[1_1_8rem] flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-[10px] font-semibold tracking-[0.08em] uppercase opacity-65">
            {stage} · {book.title} ·{' '}
            {t('generation.chapterLabel', { number: current.position + 1 })}
          </span>
          {audio.totalChunks > 0 && (
            <span className="shrink-0 text-xs tabular-nums opacity-65">
              {t('book.audioPartsShort', {
                completed: audio.completedChunks,
                total: audio.totalChunks,
              })}
            </span>
          )}
        </div>
        <Progress
          value={getAudioProgress(audio) ?? null}
          aria-label={stage}
          className={progressStyle}
        />
        <span className="truncate font-serif text-[13px] opacity-65">
          {current.title}
          {more > 0 && ` · ${t('generation.more', { count: more })}`}
        </span>
      </div>
      {action}
    </div>
  );
}
