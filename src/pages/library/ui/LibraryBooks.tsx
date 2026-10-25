import { BookOpenIcon } from 'lucide-react';
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="h-full transition-colors hover:bg-muted/50">
        {book.hasCover &&
          (coverQuery.data ? (
            <img
              src={coverQuery.data.coverUrl}
              alt={t('book.coverAlt', { title: book.title })}
              className="h-52 w-full object-cover"
              loading="lazy"
              onError={() => {
                void coverQuery.refetch();
              }}
            />
          ) : (
            <div
              className="flex h-52 items-center justify-center bg-muted text-muted-foreground"
              aria-hidden="true"
            >
              <BookOpenIcon className="size-8" />
            </div>
          ))}
        <CardHeader>
          <CardTitle className="truncate" title={book.title}>
            {book.title}
          </CardTitle>
          <CardDescription
            className="truncate"
            title={book.sourceOriginalFilename}
          >
            {book.sourceOriginalFilename}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant={status.variant}>{status.label}</Badge>
        </CardContent>
        <CardFooter>
          <BookOpenIcon aria-hidden="true" />
          <span className="ml-2 text-muted-foreground">
            {t('library.chapterCount', { count: book.chapterCount })}
          </span>
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
