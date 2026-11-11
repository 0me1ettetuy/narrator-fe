import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { LoaderCircleIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collectionsControllerDeleteCollectionMutation,
  collectionsControllerGetCollectionQueryKey,
  collectionsControllerListCollectionsQueryKey,
  collectionsControllerListPublicCollectionsQueryKey,
  getApiErrorCode,
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
import { toast } from '@/shared/ui/toast';

type DeleteCollectionButtonProps = {
  collectionId: string;
  title: string;
};

export function DeleteCollectionButton({
  collectionId,
  title,
}: DeleteCollectionButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const deleteCollection = useMutation({
    ...collectionsControllerDeleteCollectionMutation(),
    onSuccess: completeDeletion,
    onError: async (error) => {
      // Already gone (e.g. deleted in another tab): the outcome the user asked for.
      if (getApiErrorCode(error) === 'NOT_FOUND') {
        await completeDeletion();
      }
    },
  });
  const isPending = deleteCollection.isPending;

  async function completeDeletion() {
    setIsOpen(false);
    // Leave the collection's page before dropping its query so it isn't refetched.
    await navigate({ to: '/library' });
    queryClient.removeQueries({
      queryKey: collectionsControllerGetCollectionQueryKey({
        path: { collectionId },
      }),
    });
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: collectionsControllerListCollectionsQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: collectionsControllerListPublicCollectionsQueryKey(),
      }),
    ]);
    toast.add({ title: t('collection.deleted', { title }), type: 'success' });
  }

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isPending) {
          deleteCollection.reset();
          setIsOpen(open);
        }
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-destructive/35 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2Icon aria-hidden="true" />
            {t('collection.delete')}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia variant="destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('collection.deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('collection.deleteDescription', { title })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteCollection.error &&
        getApiErrorCode(deleteCollection.error) !== 'NOT_FOUND' ? (
          <p className="text-sm text-destructive" role="alert">
            {t(getApiErrorTranslationKey(deleteCollection.error))}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t('collection.keep')}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => deleteCollection.mutate({ path: { collectionId } })}
          >
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2Icon aria-hidden="true" />
            )}
            {isPending ? t('collection.deleting') : t('collection.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
