import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerListBooksOptions,
  type CollectionBookEntryResponseDto,
  type CollectionSummaryResponseDto,
} from '@/shared/api';
import { AddToCollectionAction } from '@/features/add-to-collection';
import { Button } from '@/shared/ui/button';
import { DataState } from '@/shared/ui/data-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

type AddBooksDialogProps = {
  collection: CollectionSummaryResponseDto;
  entries: CollectionBookEntryResponseDto[];
};

export function AddBooksDialog({ collection, entries }: AddBooksDialogProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <PlusIcon aria-hidden="true" />
            {t('collection.addBooks')}
          </Button>
        }
      />
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b p-5 pr-12">
          <DialogTitle>{t('collection.addBooks')}</DialogTitle>
          <DialogDescription>
            {t('collection.addBooksDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto p-5">
          <BookPicker collection={collection} entries={entries} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Mounted only while the dialog is open, so its query runs only then.
function BookPicker({ collection, entries }: AddBooksDialogProps) {
  const { t } = useTranslation();
  // shortcut: shows the 50 newest books, add search if users outgrow it.
  const booksQuery = useQuery(
    booksControllerListBooksOptions({ query: { source: 'all', limit: 50 } }),
  );
  const bookIdsInCollection = useMemo(
    () => new Set(entries.map((entry) => entry.bookId)),
    [entries],
  );

  return (
    <DataState
      query={booksQuery}
      isEmpty={(data) => data.books.length === 0}
      empty={
        <p className="text-sm text-muted-foreground">
          {t('collection.noBooksToAdd')}
        </p>
      }
    >
      {(data) => (
        <ul className="space-y-3">
          {data.books.map((book) => (
            <li
              key={book.id}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <span className="min-w-0 truncate font-medium">{book.title}</span>
              <AddToCollectionAction
                collection={collection}
                book={book}
                isInCollection={bookIdsInCollection.has(book.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </DataState>
  );
}
