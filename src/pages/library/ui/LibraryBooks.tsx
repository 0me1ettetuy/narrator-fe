import { BookOpenIcon, ChevronRightIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetBookCoverAccessOptions,
  type BookSummaryResponseDto,
} from '@/shared/api';
import { Badge } from '@/shared/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

type LibraryBooksProps = {
  books: BookSummaryResponseDto[];
};

export function LibraryBooks({ books }: LibraryBooksProps) {
  return (
    <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {books.map((book) => (
        <LibraryBookCard key={book.id} book={book} />
      ))}
    </div>
  );
}

type LibraryBookCardProps = {
  book: BookSummaryResponseDto;
};

type BookStatus = {
  label: string;
  variant: ComponentProps<typeof Badge>['variant'];
};

function LibraryBookCard({ book }: LibraryBookCardProps) {
  const { t } = useTranslation();
  const status = getBookStatus(book.parseStatus, t);
  const coverQuery = useQuery({
    ...booksControllerGetBookCoverAccessOptions({
      path: { bookId: book.id },
    }),
    enabled: book.hasCover,
    staleTime: 14 * 60 * 1_000,
  });

  return (
    <Link
      to="/library/$bookId"
      params={{ bookId: book.id }}
      aria-label={t('library.openBook', { title: book.title })}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="h-full gap-0 py-0">
        {book.hasCover &&
          (coverQuery.data ? (
            <img
              src={coverQuery.data.coverUrl}
              alt={t('book.coverAlt', { title: book.title })}
              className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
              onError={() => {
                void coverQuery.refetch();
              }}
            />
          ) : (
            <div
              className="flex aspect-[16/9] items-center justify-center bg-muted text-muted-foreground"
              aria-hidden="true"
            >
              <BookOpenIcon className="size-8" />
            </div>
          ))}
        {!book.hasCover && (
          <div
            className="flex aspect-[16/9] items-center justify-center bg-muted text-muted-foreground"
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
            title={book.sourceOriginalFilename}
          >
            {book.sourceOriginalFilename}
          </CardDescription>
          <CardAction>
            <Badge variant={status.variant}>{status.label}</Badge>
          </CardAction>
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
      </Card>
    </Link>
  );
}

function getBookStatus(
  status: BookSummaryResponseDto['parseStatus'],
  t: ReturnType<typeof useTranslation>['t'],
): BookStatus {
  switch (status) {
    case 'UPLOADING':
      return { label: t('library.statusUploading'), variant: 'secondary' };
    case 'QUEUED':
      return { label: t('library.statusQueued'), variant: 'secondary' };
    case 'PROCESSING':
      return { label: t('library.statusProcessing'), variant: 'outline' };
    case 'READY':
      return { label: t('library.statusReady'), variant: 'default' };
    case 'FAILED':
      return { label: t('library.statusFailed'), variant: 'destructive' };
  }
}
