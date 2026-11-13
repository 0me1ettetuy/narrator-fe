import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import {
  EllipsisIcon,
  FolderPlusIcon,
  GlobeIcon,
  LoaderCircleIcon,
  LockIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeleteBookButton } from '@/features/delete-book';
import {
  booksControllerGetBookQueryKey,
  booksControllerListBooksQueryKey,
  booksControllerListPublicBooksQueryKey,
  booksControllerUpdateVisibilityMutation,
  getApiErrorTranslationKey,
  type BookSummaryResponseDto,
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
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { toast } from '@/shared/ui/toast';
import { AddToCollectionDialog } from './AddToCollectionDialog';

// The book's page and the library list both show it, so a visibility change
// refreshes the detail and both lists.
function invalidateVisibility(queryClient: QueryClient, bookId: string) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: booksControllerGetBookQueryKey({ path: { bookId } }),
    }),
    queryClient.invalidateQueries({
      queryKey: booksControllerListBooksQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: booksControllerListPublicBooksQueryKey(),
    }),
  ]);
}

// Owner actions behind one menu; each opens its own dialog, controlled here.
export function BookActionsMenu({
  book,
  triggerClassName,
  onDeleted,
}: {
  book: BookSummaryResponseDto;
  triggerClassName?: string;
  onDeleted?: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<
    'collection' | 'public' | 'delete' | null
  >(null);
  const makePrivate = useMutation({
    ...booksControllerUpdateVisibilityMutation(),
    onSuccess: async () => {
      await invalidateVisibility(queryClient, book.id);
    },
    onError: (error) => {
      toast.add({
        title: t(getApiErrorTranslationKey(error)),
        type: 'error',
        priority: 'high',
      });
    },
  });
  const label = t('book.actions');

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className={triggerClassName}
              aria-label={label}
              title={label}
            />
          }
        >
          <EllipsisIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-58">
          <DropdownMenuItem onClick={() => setDialog('collection')}>
            <FolderPlusIcon aria-hidden="true" />
            {t('collection.addToCollection')}
          </DropdownMenuItem>
          {book.visibility === 'PUBLIC' ? (
            <DropdownMenuItem
              disabled={makePrivate.isPending}
              onClick={() =>
                makePrivate.mutate({
                  path: { bookId: book.id },
                  body: { visibility: 'PRIVATE' },
                })
              }
            >
              <LockIcon aria-hidden="true" />
              {t('book.makePrivate')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={book.parseStatus !== 'READY'}
              onClick={() => setDialog('public')}
            >
              <GlobeIcon aria-hidden="true" />
              {t('book.makePublic')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDialog('delete')}
          >
            <Trash2Icon aria-hidden="true" />
            {t('book.deleteBook')}…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AddToCollectionDialog
        book={book}
        open={dialog === 'collection'}
        onOpenChange={(open) => setDialog(open ? 'collection' : null)}
      />
      <MakePublicDialog
        book={book}
        open={dialog === 'public'}
        onOpenChange={(open) => setDialog(open ? 'public' : null)}
      />
      <DeleteBookButton
        bookId={book.id}
        bookTitle={book.title}
        variant="none"
        open={dialog === 'delete'}
        onOpenChange={(open) => setDialog(open ? 'delete' : null)}
        onDeleted={onDeleted}
      />
    </>
  );
}

// Making a book public exposes it to every signed-in user, so this direction
// asks for confirmation; reverting to private does not.
function MakePublicDialog({
  book,
  open,
  onOpenChange,
}: {
  book: BookSummaryResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const updateVisibility = useMutation({
    ...booksControllerUpdateVisibilityMutation(),
    onSuccess: async () => {
      onOpenChange(false);
      await invalidateVisibility(queryClient, book.id);
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!updateVisibility.isPending) {
          updateVisibility.reset();
          onOpenChange(next);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <GlobeIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('book.makePublicTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('book.makePublicDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
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
            onClick={() =>
              updateVisibility.mutate({
                path: { bookId: book.id },
                body: { visibility: 'PUBLIC' },
              })
            }
          >
            {updateVisibility.isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : (
              <GlobeIcon aria-hidden="true" />
            )}
            {t('book.makePublic')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
