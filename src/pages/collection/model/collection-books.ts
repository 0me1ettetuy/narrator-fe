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

// What a draft book list changes against the server's: the books added (in
// draft order) and removed, and whether the order needs saving once those are
// applied (the server appends an added book, so the expected order is the kept
// books in their order, then the added ones).
export function diffBookIds(serverIds: string[], draftIds: string[]) {
  const server = new Set(serverIds);
  const draft = new Set(draftIds);
  const removed = serverIds.filter((id) => !draft.has(id));
  const added = draftIds.filter((id) => !server.has(id));
  const expected = [...serverIds.filter((id) => draft.has(id)), ...added];

  return { added, removed, isReordered: expected.join() !== draftIds.join() };
}
