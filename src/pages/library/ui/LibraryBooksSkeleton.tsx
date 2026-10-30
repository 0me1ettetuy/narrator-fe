import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/shared/ui/skeleton';

const SKELETON_CARDS = [0, 1, 2, 3, 4, 5];

export function LibraryBooksSkeleton() {
  const { t } = useTranslation();

  return (
    <div
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label={t('library.loadingBooks')}
    >
      <span className="sr-only">{t('library.loadingBooks')}</span>
      {SKELETON_CARDS.map((index) => (
        <div
          className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
          key={index}
        >
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <div className="p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </div>
          <div className="border-t bg-muted/50 p-4">
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
