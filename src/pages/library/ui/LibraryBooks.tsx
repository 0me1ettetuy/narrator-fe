import { BookmarkXIcon, UploadIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BookCoverTile } from '@/entities/book';
import { PlayBookButton } from '@/features/audio-player';
import {
  booksControllerListBooksQueryKey,
  booksControllerRemoveFromLibraryMutation,
  type BookSummaryResponseDto,
} from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { TileActions, tileButtonClass } from '@/shared/ui/tile-actions';
import { BookActionsMenu } from '@/widgets/book-actions-menu';
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
// author and title, one meta line under the tile. The actions menu (own books) or
// remove (added books) shows top-right on hover; always visible where there is no hover.
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
      <TileActions>
        {book.hasReadyAudio && book.parseStatus === 'READY' && (
          <PlayBookButton
            bookId={book.id}
            iconOnly
            className={tileButtonClass}
          />
        )}
        {book.isOwner ? (
          <BookActionsMenu book={book} triggerClassName={tileButtonClass} />
        ) : (
          <RemoveFromLibraryButton bookId={book.id} bookTitle={book.title} />
        )}
      </TileActions>
      <p className="min-h-8 text-[13px] text-muted-foreground">{meta}</p>
    </article>
  );
}

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
      variant="secondary"
      size="icon-sm"
      disabled={removeFromLibrary.isPending}
      className={tileButtonClass}
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
