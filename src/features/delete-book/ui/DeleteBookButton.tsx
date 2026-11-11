import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerDeleteBookMutation,
  booksControllerListBooksQueryKey,
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
import { cn } from '@/shared/lib/utils';
import { toast } from '@/shared/ui/toast';
import { isBookScopedQuery } from '../model/book-queries';

type DeleteBookButtonProps = {
  bookId: string;
  bookTitle: string;
  // 'none' renders no trigger: the caller opens it with open/onOpenChange.
  variant: 'icon' | 'button' | 'none';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  onDeleted?: () => void | Promise<void>;
};

export function DeleteBookButton({
  bookId,
  bookTitle,
  variant,
  open,
  onOpenChange,
  className,
  onDeleted,
}: DeleteBookButtonProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [innerOpen, setInnerOpen] = useState(false);
  const isOpen = open ?? innerOpen;
  const setIsOpen = onOpenChange ?? setInnerOpen;
  const deleteBook = useMutation({
    ...booksControllerDeleteBookMutation(),
    onSuccess: completeDeletion,
    onError: async (error) => {
      // Already gone (e.g. deleted in another tab): the outcome the user asked for.
      if (getApiErrorCode(error) === 'NOT_FOUND') {
        await completeDeletion();
      }
    },
  });
  const label = t('book.deleteBookLabel', { title: bookTitle });
  const isPending = deleteBook.isPending;

  async function completeDeletion() {
    setIsOpen(false);
    // Leave the book's page before dropping its queries so they are not refetched.
    await onDeleted?.();
    queryClient.removeQueries({
      predicate: (query) => isBookScopedQuery(query.queryKey, bookId),
    });
    await queryClient.invalidateQueries({
      queryKey: booksControllerListBooksQueryKey(),
    });
    toast.add({
      title: t('book.bookDeleted', { title: bookTitle }),
      type: 'success',
    });
  }

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isPending) {
          deleteBook.reset();
          setIsOpen(open);
        }
      }}
    >
      {variant !== 'none' && (
        <AlertDialogTrigger
          render={
            variant === 'icon' ? (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(
                  'border-destructive/35 bg-background/90 text-destructive backdrop-blur-sm hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive',
                  className,
                )}
                aria-label={label}
                title={label}
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'border-destructive/35 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive',
                  className,
                )}
                aria-label={label}
              >
                <Trash2Icon aria-hidden="true" />
                {t('book.deleteBook')}
              </Button>
            )
          }
        />
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia variant="destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('book.deleteBookTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('book.deleteBookDescription', { title: bookTitle })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteBook.error &&
        getApiErrorCode(deleteBook.error) !== 'NOT_FOUND' ? (
          <p className="text-sm text-destructive" role="alert">
            {t(getApiErrorTranslationKey(deleteBook.error))}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t('book.keepBook')}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => deleteBook.mutate({ path: { bookId } })}
          >
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2Icon aria-hidden="true" />
            )}
            {isPending ? t('book.deletingBook') : t('book.deleteBook')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
