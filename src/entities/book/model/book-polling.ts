import type { BookDetailResponseDto } from '@/shared/api';

// Poll while parsing or while any chapter audio is still being produced.
export function shouldPollBook(book: BookDetailResponseDto | undefined) {
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
