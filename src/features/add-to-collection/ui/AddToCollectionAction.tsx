import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckIcon, GlobeIcon, LoaderCircleIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetBookQueryKey,
  booksControllerListBooksQueryKey,
  booksControllerListPublicBooksQueryKey,
  collectionsControllerAddBookMutation,
  collectionsControllerGetCollectionQueryKey,
  collectionsControllerListCollectionsQueryKey,
  getApiErrorTranslationKey,
} from '@/shared/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';

type AddToCollectionActionProps = {
  collection: { id: string; title: string; visibility: string };
  book: {
    id: string;
    title: string;
    visibility: string;
    parseStatus: string;
  };
  isInCollection: boolean;
};

// The one "add book to collection" action, shared by the book page and the
// collection page. Adding a private book to a public collection publishes it,
// so that case asks first.
export function AddToCollectionAction({
  collection,
  book,
  isInCollection,
}: AddToCollectionActionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const addBook = useMutation({
    ...collectionsControllerAddBookMutation(),
    onSuccess: async () => {
      setIsConfirmOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: collectionsControllerGetCollectionQueryKey({
            path: { collectionId: collection.id },
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: collectionsControllerListCollectionsQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: booksControllerGetBookQueryKey({
            path: { bookId: book.id },
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: booksControllerListBooksQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: booksControllerListPublicBooksQueryKey(),
        }),
      ]);
    },
  });

  const label = t('collection.addLabel', {
    book: book.title,
    collection: collection.title,
  });
  const isPublishingAdd =
    collection.visibility === 'PUBLIC' && book.visibility === 'PRIVATE';
  const isBlockedByProcessing = isPublishingAdd && book.parseStatus !== 'READY';

  if (isInCollection) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        aria-label={label}
      >
        <CheckIcon aria-hidden="true" />
        {t('collection.added')}
      </Button>
    );
  }

  if (isBlockedByProcessing) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          aria-label={label}
        >
          <PlusIcon aria-hidden="true" />
          {t('collection.add')}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t('collection.bookNotReady')}
        </p>
      </div>
    );
  }

  const pending = addBook.isPending;
  const pendingIcon = pending ? (
    <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
  ) : (
    <PlusIcon aria-hidden="true" />
  );
  const errorMessage = addBook.error ? (
    <p className="text-sm text-destructive" role="alert">
      {t(getApiErrorTranslationKey(addBook.error))}
    </p>
  ) : null;

  if (isPublishingAdd) {
    return (
      <AlertDialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!pending) {
            addBook.reset();
            setIsConfirmOpen(open);
          }
        }}
      >
        <AlertDialogTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={label}
            >
              {pendingIcon}
              {t('collection.add')}
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <GlobeIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {t('collection.publishOnAddTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('collection.publishOnAddDescription', {
                collection: collection.title,
                book: book.title,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorMessage}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              disabled={pending}
              onClick={() =>
                addBook.mutate({
                  path: { collectionId: collection.id },
                  body: { bookId: book.id, makePublic: true },
                })
              }
            >
              {pendingIcon}
              {t('collection.publishAndAdd')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={label}
        disabled={pending}
        onClick={() =>
          addBook.mutate({
            path: { collectionId: collection.id },
            body: { bookId: book.id },
          })
        }
      >
        {pendingIcon}
        {t('collection.add')}
      </Button>
      {errorMessage}
    </div>
  );
}
