import { useSyncExternalStore } from 'react';
import type { ActiveAudioBookResponseDto } from '@/shared/api';

// Books the user stopped from the island. The backend only lists queued or
// processing audio, so a stopped book would vanish; we keep its last snapshot
// here so the island can offer Continue. In memory on purpose: a reload or
// logout drops it. `confirmed` means the stop went through; only then does a
// running book with the same id mean "resumed" rather than "still stopping".
type Entry = { book: ActiveAudioBookResponseDto; confirmed: boolean };

let entries: Entry[] = [];
const listeners = new Set<() => void>();

function set(next: Entry[]) {
  entries = next;
  listeners.forEach((listener) => listener());
}

export function pauseBook(book: ActiveAudioBookResponseDto) {
  set([
    ...entries.filter((entry) => entry.book.bookId !== book.bookId),
    { book, confirmed: false },
  ]);
}

export function confirmPaused(bookId: string) {
  set(
    entries.map((entry) =>
      entry.book.bookId === bookId ? { ...entry, confirmed: true } : entry,
    ),
  );
}

export function dropPaused(bookId: string) {
  set(entries.filter((entry) => entry.book.bookId !== bookId));
}

export function clearPausedBooks() {
  set([]);
}

export function usePausedBooks(): readonly Entry[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => entries,
  );
}
