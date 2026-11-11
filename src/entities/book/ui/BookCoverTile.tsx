import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BookOpenIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetBookCoverAccessOptions,
  type BookSummaryResponseDto,
} from '@/shared/api';
import { cn } from '@/shared/lib/utils';
import { useCoverColor } from '../model/use-cover-color';

// Cover-led book tile (design "Library"): 4:3 art on top, a band below with
// author and title, optional status chip top right. Links to the book page.
export function BookCoverTile({
  book,
  statusLabel,
}: {
  book: BookSummaryResponseDto;
  statusLabel?: string | null;
}) {
  const { t } = useTranslation();
  const authorNames = book.authors.map((author) => author.name).join(', ');
  const coverQuery = useQuery({
    ...booksControllerGetBookCoverAccessOptions({
      path: { bookId: book.id },
    }),
    enabled: book.hasCover,
    staleTime: 14 * 60 * 1_000,
  });
  const cover = useCoverColor(coverQuery.data?.coverUrl);

  return (
    <Link
      to="/library/$bookId"
      params={{ bookId: book.id }}
      aria-label={t('library.openBook', { title: book.title })}
      title={book.title}
      style={cover ?? undefined}
      className={cn(
        'group noise relative flex aspect-[3/4] flex-col overflow-hidden',
        !cover && 'bg-foreground text-background',
      )}
    >
      <div className="aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted text-muted-foreground">
        {book.hasCover && coverQuery.data ? (
          <img
            src={coverQuery.data.coverUrl}
            alt=""
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.01]"
            loading="lazy"
            onError={() => {
              void coverQuery.refetch();
            }}
          />
        ) : (
          <div
            className="flex size-full items-center justify-center"
            aria-hidden="true"
          >
            <BookOpenIcon className="size-8" />
          </div>
        )}
      </div>
      <span className="flex min-h-0 flex-1 flex-col justify-end gap-1.5 px-3.5 pt-3 pb-3.5">
        <span className="truncate text-[9px] font-semibold tracking-[0.08em] uppercase">
          {authorNames || t('book.unknownAuthor')}
        </span>
        <span className="font-serif text-lg leading-[1.12]">{book.title}</span>
      </span>
      {statusLabel && (
        <span
          className={
            book.parseStatus === 'FAILED'
              ? 'absolute top-2 right-2 z-10 inline-flex h-5 items-center gap-1.5 bg-destructive px-1.5 text-[10px] font-semibold tracking-[0.06em] text-destructive-foreground uppercase'
              : 'absolute top-2 right-2 z-10 inline-flex h-5 items-center gap-1.5 bg-card px-1.5 text-[10px] font-semibold tracking-[0.06em] text-destructive-text uppercase'
          }
        >
          <span
            className="size-1.5 border-[1.5px] border-current"
            aria-hidden="true"
          />
          {statusLabel}
        </span>
      )}
    </Link>
  );
}
