import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GlobeIcon, LoaderCircleIcon, LockIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetBookQueryKey,
  booksControllerListBooksQueryKey,
  booksControllerListPublicBooksQueryKey,
  collectionsControllerGetCollectionQueryKey,
  collectionsControllerListCollectionsQueryKey,
  collectionsControllerListPublicCollectionsQueryKey,
  collectionsControllerUpdateVisibilityMutation,
  getApiErrorTranslationKey,
  type CollectionBookEntryResponseDto,
  type CollectionSummaryResponseDto,
} from '@/shared/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { toast } from '@/shared/ui/toast';
import {
  getBooksBlockingPublish,
  getBooksToPublish,
} from '../model/collection-books';

type CollectionVisibilityToggleProps = {
  collection: CollectionSummaryResponseDto;
  entries: CollectionBookEntryResponseDto[];
};

export function CollectionVisibilityToggle({
  collection,
  entries,
}: CollectionVisibilityToggleProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const updateVisibility = useMutation({
    ...collectionsControllerUpdateVisibilityMutation(),
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
          queryKey: collectionsControllerListPublicCollectionsQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: booksControllerListBooksQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: booksControllerListPublicBooksQueryKey(),
        }),
        // Each book whose visibility changed needs a fresh detail query.
        ...getBooksToPublish(entries).map((entry) =>
          queryClient.invalidateQueries({
            queryKey: booksControllerGetBookQueryKey({
              path: { bookId: entry.bookId },
            }),
          }),
        ),
      ]);
    },
  });
  const isPublic = collection.visibility === 'PUBLIC';
  const blockingBooks = getBooksBlockingPublish(entries);

  function setVisibility(visibility: 'PUBLIC' | 'PRIVATE') {
    updateVisibility.mutate({
      path: { collectionId: collection.id },
      body: { visibility },
    });
  }

  if (isPublic) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={updateVisibility.isPending}
        onClick={() =>
          updateVisibility.mutate(
            {
              path: { collectionId: collection.id },
              body: { visibility: 'PRIVATE' },
            },
            {
              onSuccess: () =>
                toast.add({
                  title: t('collection.madePrivate'),
                  type: 'success',
                }),
            },
          )
        }
      >
        {updateVisibility.isPending ? (
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        ) : (
          <LockIcon aria-hidden="true" />
        )}
        {t('collection.makePrivate')}
      </Button>
    );
  }

  if (blockingBooks.length > 0) {
    return (
      <div className="space-y-2">
        <Button type="button" variant="outline" size="sm" disabled>
          <GlobeIcon aria-hidden="true" />
          {t('collection.makePublic')}
        </Button>
        <p className="text-sm text-muted-foreground">
          {t('collection.notReadyHint')}
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground">
          {blockingBooks.map((entry) => (
            <li key={entry.bookId}>{entry.title}</li>
          ))}
        </ul>
      </div>
    );
  }

  const booksToPublish = getBooksToPublish(entries);

  return (
    <AlertDialog
      open={isConfirmOpen}
      onOpenChange={(open) => {
        if (!updateVisibility.isPending) {
          updateVisibility.reset();
          setIsConfirmOpen(open);
        }
      }}
    >
      <AlertDialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <GlobeIcon aria-hidden="true" />
            {t('collection.makePublic')}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('collection.makePublicTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('collection.makePublicDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {booksToPublish.length > 0 && (
          <div className="max-h-48 overflow-y-auto text-sm">
            <p className="mb-2 text-muted-foreground">
              {t('collection.makePublicBooksWarning')}
            </p>
            <ul className="list-inside list-disc">
              {booksToPublish.map((entry) => (
                <li key={entry.bookId}>{entry.title}</li>
              ))}
            </ul>
          </div>
        )}
        {updateVisibility.error && (
          <p className="text-sm text-destructive" role="alert">
            {t(getApiErrorTranslationKey(updateVisibility.error))}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={updateVisibility.isPending}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={updateVisibility.isPending}
            onClick={() => setVisibility('PUBLIC')}
          >
            {updateVisibility.isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : (
              <GlobeIcon aria-hidden="true" />
            )}
            {t('collection.makePublic')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
