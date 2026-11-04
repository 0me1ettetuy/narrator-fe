import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  CompassIcon,
  LibraryBigIcon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerListBooksOptions,
  booksControllerListPublicBooksOptions,
} from '@/shared/api';
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
import { Input } from '@/shared/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { toast } from '@/shared/ui/toast';
import { EpubUploadForm } from './EpubUploadForm';
import { LibraryBooks } from './LibraryBooks';
import { LibraryBooksSkeleton } from './LibraryBooksSkeleton';
import { PublicLibraryBooks } from './PublicLibraryBooks';

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
        <Button className="shrink-0" onClick={() => setIsUploadOpen(true)}>
          <PlusIcon aria-hidden="true" />
          {t('library.addBook')}
        </Button>
      </div>

      <Tabs defaultValue="mine" className="mt-6">
        <TabsList>
          <TabsTrigger value="mine">
            <LibraryBigIcon aria-hidden="true" />
            {t('library.myLibraryTab')}
          </TabsTrigger>
          <TabsTrigger value="community">
            <CompassIcon aria-hidden="true" />
            {t('library.communityTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-6">
          <MyLibraryTab onAddBook={() => setIsUploadOpen(true)} />
        </TabsContent>

        <TabsContent value="community" className="mt-6">
          <CommunityLibraryTab />
        </TabsContent>
      </Tabs>

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

function MyLibraryTab({ onAddBook }: { onAddBook: () => void }) {
  const { t } = useTranslation();
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

  return (
    <div>
      <fieldset className="flex flex-wrap items-center gap-1">
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
                <Button onClick={onAddBook}>
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
    </div>
  );
}

// No existing debounce hook in this app; a short inline one keeps this tab
// self-contained instead of adding a shared utility for a single caller.
function useDebouncedValue<Value>(value: Value, delayMs: number): Value {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

function CommunityLibraryTab() {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const booksQuery = useQuery({
    ...booksControllerListPublicBooksOptions({
      query: { limit: 24, search: search || undefined },
    }),
  });

  return (
    <div>
      <div className="relative w-full sm:w-64">
        <SearchIcon
          className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          className="pl-8"
          placeholder={t('library.browseSearchPlaceholder')}
          aria-label={t('library.browseSearchPlaceholder')}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      <div className="mt-6">
        <DataState
          query={booksQuery}
          isEmpty={(data) => data.books.length === 0}
          loading={<LibraryBooksSkeleton />}
          empty={
            <Empty className="min-h-64">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CompassIcon />
                </EmptyMedia>
                <EmptyTitle>{t('library.browseEmptyTitle')}</EmptyTitle>
                <EmptyDescription>
                  {t('library.browseEmptyDescription')}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent />
            </Empty>
          }
        >
          {(data) => (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('library.bookCount', { count: data.books.length })}
              </p>
              <PublicLibraryBooks books={data.books} />
            </div>
          )}
        </DataState>
      </div>
    </div>
  );
}
