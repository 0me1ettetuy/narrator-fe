import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';

// Book heights like the shelf: standing on one line, each a different height.
const BOOK_HEIGHTS = ['h-40', 'h-48', 'h-44', 'h-56', 'h-40', 'h-52', 'h-48'];

export function LibraryShelfSkeleton() {
  const { t } = useTranslation();

  return (
    <div
      className="grid grid-cols-4 items-end gap-2 sm:grid-cols-5 lg:grid-cols-7"
      role="status"
      aria-label={t('library.loadingBooks')}
    >
      <span className="sr-only">{t('library.loadingBooks')}</span>
      {BOOK_HEIGHTS.map((height, index) => (
        <Skeleton key={index} className={cn('w-full', height)} />
      ))}
    </div>
  );
}
