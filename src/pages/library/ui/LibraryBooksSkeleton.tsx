import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/shared/ui/skeleton';

const SKELETON_CARDS = [0, 1, 2, 3, 4, 5];

export function LibraryBooksSkeleton() {
  const { t } = useTranslation();

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label={t('library.loadingBooks')}
    >
      <span className="sr-only">{t('library.loadingBooks')}</span>
      {SKELETON_CARDS.map((index) => (
        <div
          className="rounded-xl bg-card p-4 ring-1 ring-foreground/10"
          key={index}
        >
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-5 h-5 w-28" />
          <Skeleton className="mt-7 h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
