import { useQuery } from '@tanstack/react-query';
import { BookOpenIcon } from 'lucide-react';
import { booksControllerGetBookCoverAccessOptions } from '@/shared/api';
import { cn } from '@/shared/lib/utils';

// Small cover for dark surfaces like the island: the signed cover, or a book
// icon while there is none.
export function BookCoverThumb({
  bookId,
  hasCover,
  className,
}: {
  bookId: string;
  hasCover: boolean;
  className?: string;
}) {
  const cover = useQuery({
    ...booksControllerGetBookCoverAccessOptions({ path: { bookId } }),
    enabled: hasCover,
    staleTime: 14 * 60 * 1_000,
  });

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden bg-background/15',
        className,
      )}
    >
      {hasCover && cover.data ? (
        <img
          src={cover.data.coverUrl}
          alt=""
          className="size-full object-cover"
          onError={() => void cover.refetch()}
        />
      ) : (
        <BookOpenIcon className="size-4" />
      )}
    </span>
  );
}
