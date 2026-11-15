import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { booksControllerGetBookOptions } from '@/shared/api';
import { DataState } from '@/shared/ui/data-state';
import { Skeleton } from '@/shared/ui/skeleton';
import { ChapterEditor } from '@/widgets/chapter-editor';

export function ChapterReorganizePage({ bookId }: { bookId: string }) {
  const { t } = useTranslation();
  const bookQuery = useQuery(
    booksControllerGetBookOptions({ path: { bookId } }),
  );

  return (
    <section className="mx-auto flex h-[calc(100svh-3.5rem)] max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
      <div className="flex min-w-0 shrink-0 flex-col gap-2">
        <h1 className="text-[32px] leading-[1.1] font-medium tracking-[-0.02em]">
          {t('book.reorganizeChapters')}
        </h1>
        <p className="font-serif text-sm text-muted-foreground">
          {t('book.reorganizeIntro')}
        </p>
      </div>
      <DataState
        query={bookQuery}
        isEmpty={(data) => data.chapters.length === 0}
        loading={<Skeleton className="h-96 w-full" />}
      >
        {(data) => <ChapterEditor bookId={bookId} chapters={data.chapters} />}
      </DataState>
    </section>
  );
}
