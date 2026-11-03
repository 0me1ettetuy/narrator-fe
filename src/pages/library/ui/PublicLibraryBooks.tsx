import {
  BookmarkCheckIcon,
  BookmarkPlusIcon,
  BookOpenIcon,
  ChevronRightIcon,
  LoaderCircleIcon,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  booksControllerAddToLibraryMutation,
  booksControllerGetBookCoverAccessOptions,
  booksControllerListBooksQueryKey,
  booksControllerListPublicBooksQueryKey,
  booksControllerRemoveFromLibraryMutation,
  type BookSummaryResponseDto,
} from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

type PublicLibraryBooksProps = {
  books: BookSummaryResponseDto[];
};

export function PublicLibraryBooks({ books }: PublicLibraryBooksProps) {
  return (
    <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {books.map((book) => (
        <PublicLibraryBookCard key={book.id} book={book} />
      ))}
    </div>
  );
}

function PublicLibraryBookCard({ book }: { book: BookSummaryResponseDto }) {
  const { t } = useTranslation();
  const coverQuery = useQuery({
    ...booksControllerGetBookCoverAccessOptions({
      path: { bookId: book.id },
    }),
    enabled: book.hasCover,
    staleTime: 14 * 60 * 1_000,
  });

  return (
    <Card className="h-full gap-0 py-0">
      <Link
        to="/library/$bookId"
        params={{ bookId: book.id }}
        aria-label={t('library.openBook', { title: book.title })}
        className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {book.hasCover &&
          (coverQuery.data ? (
            <img
              src={coverQuery.data.coverUrl}
              alt={t('book.coverAlt', { title: book.title })}
              className="aspect-[16/9] w-full rounded-t-xl object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
              onError={() => {
                void coverQuery.refetch();
              }}
            />
          ) : (
            <div
              className="flex aspect-[16/9] items-center justify-center rounded-t-xl bg-muted text-muted-foreground"
              aria-hidden="true"
            >
              <BookOpenIcon className="size-8" />
            </div>
          ))}
        {!book.hasCover && (
          <div
            className="flex aspect-[16/9] items-center justify-center rounded-t-xl bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            <BookOpenIcon className="size-10" />
          </div>
        )}
        <CardHeader className="pt-4">
          <CardTitle className="truncate" title={book.title}>
            {book.title}
          </CardTitle>
          <CardDescription
            className="truncate"
            title={book.authors.map((author) => author.name).join(', ')}
          >
            {book.authors.map((author) => author.name).join(', ') ||
              t('book.unknownAuthor')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-4" />
        <CardFooter className="justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-muted-foreground">
            <BookOpenIcon className="size-4" aria-hidden="true" />
            {t('library.chapterCount', { count: book.chapterCount })}
          </span>
          <ChevronRightIcon
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </CardFooter>
      </Link>
      <div className="border-t px-4 py-3">
        <AddToLibraryToggle book={book} />
      </div>
    </Card>
  );
}

function AddToLibraryToggle({ book }: { book: BookSummaryResponseDto }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const addToLibrary = useMutation({
    ...booksControllerAddToLibraryMutation(),
    onSuccess: invalidate,
  });
  const removeFromLibrary = useMutation({
    ...booksControllerRemoveFromLibraryMutation(),
    onSuccess: invalidate,
  });
  const isPending = addToLibrary.isPending || removeFromLibrary.isPending;

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: booksControllerListPublicBooksQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: booksControllerListBooksQueryKey(),
      }),
    ]);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('w-full', book.isAdded && 'text-muted-foreground')}
      disabled={isPending}
      onClick={() => {
        addToLibrary.reset();
        removeFromLibrary.reset();

        if (book.isAdded) {
          removeFromLibrary.mutate({ path: { bookId: book.id } });
        } else {
          addToLibrary.mutate({ path: { bookId: book.id } });
        }
      }}
    >
      {isPending ? (
        <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
      ) : book.isAdded ? (
        <BookmarkCheckIcon aria-hidden="true" />
      ) : (
        <BookmarkPlusIcon aria-hidden="true" />
      )}
      {book.isAdded ? t('book.removeFromLibrary') : t('book.addToLibrary')}
    </Button>
  );
}
