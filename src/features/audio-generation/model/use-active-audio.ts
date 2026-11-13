import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  booksControllerListActiveAudioOptions,
  type ActiveAudioBookResponseDto,
} from '@/shared/api';
import { dropPaused, usePausedBooks } from './paused-books';

export type ActiveBook = ActiveAudioBookResponseDto & { isPaused: boolean };

// The user's own books with audio queued or processing, plus the ones they
// stopped from the island (kept until continued). Polls only while something
// is running; whoever queues audio invalidates this query to wake it.
export function useActiveAudio(): ActiveBook[] {
  const query = useQuery({
    ...booksControllerListActiveAudioOptions(),
    refetchInterval: (state) =>
      state.state.data?.books.length ? 2_000 : false,
  });
  const paused = usePausedBooks();
  const running = query.data?.books ?? [];
  const runningIds = new Set(running.map((book) => book.bookId));

  // A stopped book that runs again (continued here or on its page) is no
  // longer stopped; drop it so it does not come back after it finishes.
  useEffect(() => {
    const ids = new Set(query.data?.books.map((book) => book.bookId));

    for (const entry of paused) {
      if (entry.confirmed && ids.has(entry.book.bookId)) {
        dropPaused(entry.book.bookId);
      }
    }
  }, [paused, query.data]);

  return [
    ...running.map((book) => ({ ...book, isPaused: false })),
    ...paused
      .filter((entry) => !runningIds.has(entry.book.bookId))
      .map((entry) => ({ ...entry.book, isPaused: true })),
  ];
}
