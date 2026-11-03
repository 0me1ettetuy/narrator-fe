import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { CompassIcon, LibraryBigIcon, PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { booksControllerListBooksOptions } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { DataState } from '@/shared/ui/data-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/empty';
import { toast } from '@/shared/ui/toast';
import { EpubUploadForm } from './EpubUploadForm';
import { LibraryBooks } from './LibraryBooks';
import { LibraryBooksSkeleton } from './LibraryBooksSkeleton';

const SOURCE_FILTERS = ['all', 'owned', 'added'] as const;
type SourceFilter = (typeof SOURCE_FILTERS)[number];
const SOURCE_FILTER_LABEL_KEYS: Record<SourceFilter, string> = {
  all: 'library.filterAll',
  owned: 'library.filterOwned',
  added: 'library.filterAdded',
};

export function LibraryPage() {
  const { t } = useTranslation();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const booksQuery = useQuery({
    ...booksControllerListBooksOptions({
      query: { limit: 20, source: sourceFilter },
    }),
    refetchInterval: (query) =>
      query.state.data?.books.some(
        (book) =>
          book.parseStatus === 'QUEUED' || book.parseStatus === 'PROCESSING',
      )
        ? 3_000
        : false,
  });

  function handleUploaded() {
    setIsUploadOpen(false);
    toast.add({ title: t('library.uploadQueued'), type: 'success' });
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            <LibraryBigIcon className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('library.title')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('library.description')}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" render={<Link to="/library/browse" />}>
            <CompassIcon aria-hidden="true" />
            {t('library.browseCommunity')}
          </Button>
          <Button onClick={() => setIsUploadOpen(true)}>
            <PlusIcon aria-hidden="true" />
            {t('library.addBook')}
          </Button>
        </div>
      </div>

      <fieldset className="mt-6 flex flex-wrap items-center gap-1">
        <legend className="sr-only">{t('library.filterLabel')}</legend>
        {SOURCE_FILTERS.map((value) => (
          <Button
            key={value}
            type="button"
            variant={sourceFilter === value ? 'default' : 'outline'}
            size="sm"
            aria-pressed={sourceFilter === value}
            onClick={() => setSourceFilter(value)}
          >
            {t(SOURCE_FILTER_LABEL_KEYS[value])}
          </Button>
        ))}
      </fieldset>

      <div className="mt-6">
        <DataState
          query={booksQuery}
          isEmpty={(data) => data.books.length === 0}
          loading={<LibraryBooksSkeleton />}
          empty={
            <Empty className="min-h-64">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LibraryBigIcon />
                </EmptyMedia>
                <EmptyTitle>{t('library.emptyTitle')}</EmptyTitle>
                <EmptyDescription>
                  {t('library.emptyDescription')}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setIsUploadOpen(true)}>
                  <PlusIcon />
                  {t('library.addBook')}
                </Button>
              </EmptyContent>
            </Empty>
          }
        >
          {(data) => (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-heading text-lg font-semibold tracking-tight">
                  {t(SOURCE_FILTER_LABEL_KEYS[sourceFilter])}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('library.bookCount', { count: data.books.length })}
                </p>
              </div>
              <LibraryBooks books={data.books} />
            </div>
          )}
        </DataState>
      </div>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-lg">
          <DialogHeader className="border-b p-5 pr-12">
            <DialogTitle>{t('library.uploadTitle')}</DialogTitle>
            <DialogDescription>
              {t('library.uploadDescription')}
            </DialogDescription>
          </DialogHeader>
          <EpubUploadForm onUploaded={handleUploaded} />
        </DialogContent>
      </Dialog>
    </section>
  );
}
