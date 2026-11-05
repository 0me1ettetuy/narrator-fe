import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { FolderPlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collectionsControllerListCollectionsOptions,
  type BookDetailResponseDto,
} from '@/shared/api';
import { AddToCollectionAction } from '@/features/add-to-collection';
import { Badge } from '@/shared/ui/badge';
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

type AddToCollectionDialogProps = {
  book: BookDetailResponseDto['book'];
};

export function AddToCollectionDialog({ book }: AddToCollectionDialogProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <FolderPlusIcon aria-hidden="true" />
            {t('collection.addToCollection')}
          </Button>
        }
      />
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b p-5 pr-12">
          <DialogTitle>{t('collection.addToCollection')}</DialogTitle>
          <DialogDescription>
            {t('collection.addToCollectionDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto p-5">
          <CollectionPicker book={book} />
        </div>
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
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>{t('collection.noCollectionsYet')}</p>
          <Button render={<Link to="/library" />} variant="outline" size="sm">
            {t('collection.goToCollections')}
          </Button>
        </div>
      }
    >
      {(data) => (
        <ul className="space-y-3">
          {data.collections.map((collection) => (
            <li
              key={collection.id}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium">{collection.title}</span>
                <Badge
                  variant={
                    collection.visibility === 'PUBLIC' ? 'secondary' : 'outline'
                  }
                >
                  {collection.visibility === 'PUBLIC'
                    ? t('book.publicBadge')
                    : t('collection.privateBadge')}
                </Badge>
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
