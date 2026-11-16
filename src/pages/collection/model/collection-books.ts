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
