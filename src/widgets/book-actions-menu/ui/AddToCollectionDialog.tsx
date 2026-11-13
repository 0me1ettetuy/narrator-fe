import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { FolderPlusIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collectionsControllerListCollectionsOptions,
  type BookDetailResponseDto,
} from '@/shared/api';
import { AddToCollectionAction } from '@/features/add-to-collection';
import { Button } from '@/shared/ui/button';
import { DataState } from '@/shared/ui/data-state';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

type AddToCollectionDialogProps = {
  book: BookDetailResponseDto['book'];
};

type AddToCollectionDialogControl = {
  // When set, the dialog has no trigger button and the caller opens it.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AddToCollectionDialog({
  book,
  open,
  onOpenChange,
}: AddToCollectionDialogProps & AddToCollectionDialogControl) {
  const { t } = useTranslation();
  const [innerOpen, setInnerOpen] = useState(false);

  return (
    <Dialog
      open={open ?? innerOpen}
      onOpenChange={onOpenChange ?? setInnerOpen}
    >
      {open === undefined && (
        <DialogTrigger
          render={
            <Button type="button" variant="outline" size="sm">
              <FolderPlusIcon aria-hidden="true" />
              {t('collection.addToCollection')}
            </Button>
          }
        />
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('collection.addToCollection')}</DialogTitle>
          <DialogDescription>{book.title}</DialogDescription>
        </DialogHeader>
        <div className="-mx-5 max-h-96 overflow-y-auto">
          <CollectionPicker book={book} />
        </div>
        <DialogFooter className="sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            render={<Link to="/library" />}
          >
            <PlusIcon aria-hidden="true" />
            {t('collection.new')}
          </Button>
          <DialogClose render={<Button type="button" />}>
            {t('common.done')}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Mounted only while the dialog is open, so its query runs only then.
function CollectionPicker({ book }: AddToCollectionDialogProps) {
  const { t } = useTranslation();
  // shortcut: shows the 50 newest collections, add search if users outgrow it.
  const collectionsQuery = useQuery(
    collectionsControllerListCollectionsOptions({
      query: { source: 'owned', limit: 50, bookId: book.id },
    }),
  );

  return (
    <DataState
      query={collectionsQuery}
      isEmpty={(data) => data.collections.length === 0}
      empty={
        <div className="space-y-3 px-5 text-sm text-muted-foreground">
          <p>{t('collection.noCollectionsYet')}</p>
          <Button render={<Link to="/library" />} variant="outline" size="sm">
            {t('collection.goToCollections')}
          </Button>
        </div>
      }
    >
      {(data) => (
        <ul className="border-b">
          {data.collections.map((collection) => (
            <li
              key={collection.id}
              className="flex items-center justify-between gap-3 border-t px-5 py-3"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-serif text-base">
                  {collection.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('library.bookCount', { count: collection.bookCount })}
                  {` · ${
                    collection.visibility === 'PUBLIC'
                      ? t('book.publicBadge')
                      : t('collection.privateBadge')
                  }`}
                </span>
              </div>
              <AddToCollectionAction
                collection={collection}
                book={book}
                isInCollection={collection.containsBook}
              />
            </li>
          ))}
        </ul>
      )}
    </DataState>
  );
}
