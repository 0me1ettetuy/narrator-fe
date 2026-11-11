import { BookmarkXIcon, UploadIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { DeleteBookButton } from '@/features/delete-book';
import { BookCoverTile } from '@/entities/book';
import {
  booksControllerListBooksQueryKey,
  booksControllerRemoveFromLibraryMutation,
  type BookSummaryResponseDto,
} from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { AddCard } from './AddCard';

type LibraryBooksProps = {
  books: BookSummaryResponseDto[];
  // When set, the grid starts with the add card; called with dropped files.
  onAdd?: (files: File[]) => void;
};

export function LibraryBooks({ books, onAdd }: LibraryBooksProps) {
  const { t } = useTranslation();

  return (
    <div className="grid items-start gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {onAdd && (
        <AddCard
          title={t('library.dropEpub')}
          hint={t('library.dropHint')}
          icon={<UploadIcon aria-hidden="true" />}
          onClick={() => onAdd([])}
          onDropFiles={onAdd}
        />
      )}
      {books.map((book) => (
        <LibraryBookTile key={book.id} book={book} />
      ))}
    </div>
  );
}

// Cover-led tile (design "Library"): 4:3 art on top, an ink band below with
// author and title, one meta line under the tile. Delete (own books) or remove
// (added books) shows top-left on hover; always visible where there is no hover.
function LibraryBookTile({ book }: { book: BookSummaryResponseDto }) {
  const { t } = useTranslation();
  const statusLabel = getStatusLabel(book.parseStatus, t);
  const meta = [
    book.chapterCount > 0
      ? t('library.chapterCount', { count: book.chapterCount })
      : null,
    book.language?.split('-')[0]?.toUpperCase(),
    book.isOwner && book.visibility === 'PUBLIC' ? t('book.publicBadge') : null,
    book.isOwner ? null : t('library.metaAdded'),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="group/tile relative flex min-w-0 flex-col gap-2">
      <BookCoverTile book={book} statusLabel={statusLabel} />
      {/* A sibling of the link: interactive content cannot be nested inside <a>. */}
      {book.isOwner ? (
        <DeleteBookButton
          bookId={book.id}
          bookTitle={book.title}
          variant="icon"
          className={TILE_ACTION_CLASS}
        />
      ) : (
        <RemoveFromLibraryButton bookId={book.id} bookTitle={book.title} />
      )}
      <p className="min-h-8 text-[13px] text-muted-foreground">{meta}</p>
    </article>
  );
}

// Paper square over the cover, shown on tile hover or keyboard focus. Touch
// screens have no hover, so there it stays visible.
const TILE_ACTION_CLASS =
  'absolute top-2 left-2 z-10 border-transparent bg-card text-destructive-text backdrop-blur-none transition-opacity hover:border-transparent hover:bg-destructive hover:text-destructive-foreground focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/tile:opacity-100';

function RemoveFromLibraryButton({
  bookId,
  bookTitle,
}: {
  bookId: string;
  bookTitle: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const removeFromLibrary = useMutation({
    ...booksControllerRemoveFromLibraryMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: booksControllerListBooksQueryKey(),
      });
    },
  });
  const label = t('book.removeFromLibraryLabel', { title: bookTitle });

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      disabled={removeFromLibrary.isPending}
      className={TILE_ACTION_CLASS}
      aria-label={label}
      title={label}
      onClick={() => removeFromLibrary.mutate({ path: { bookId } })}
    >
      <BookmarkXIcon aria-hidden="true" />
    </Button>
  );
}

function getStatusLabel(
  status: BookSummaryResponseDto['parseStatus'],
  t: ReturnType<typeof useTranslation>['t'],
): string | null {
  switch (status) {
    case 'UPLOADING':
      return t('library.statusUploading');
    case 'QUEUED':
      return t('library.statusQueued');
    case 'PROCESSING':
      return t('library.statusProcessing');
    case 'FAILED':
      return t('library.statusFailed');
    case 'READY':
      return null;
  }
}
