import type { CollectionBookEntryResponseDto } from '@/shared/api';

// The owner's private books that going public would publish.
export function getBooksToPublish(
  entries: CollectionBookEntryResponseDto[],
): CollectionBookEntryResponseDto[] {
  return entries.filter(
    (entry) => entry.book?.isOwner && entry.book.visibility === 'PRIVATE',
  );
}

// Books in that list that aren't READY and so block publishing.
export function getBooksBlockingPublish(
  entries: CollectionBookEntryResponseDto[],
): CollectionBookEntryResponseDto[] {
  return getBooksToPublish(entries).filter(
    (entry) => entry.book?.parseStatus !== 'READY',
  );
}

// Book ids with one entry moved. Returns ids unchanged at either end.
export function moveBookId(
  bookIds: string[],
  index: number,
  direction: -1 | 1,
): string[] {
  const copy = [...bookIds];
  const target = index + direction;

  if (target < 0 || target >= copy.length) return copy;

  const moved = copy[index];
  const other = copy[target];

  if (moved === undefined || other === undefined) return copy;

  copy[index] = other;
  copy[target] = moved;

  return copy;
}
