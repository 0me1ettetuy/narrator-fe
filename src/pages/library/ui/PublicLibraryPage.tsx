import { useQuery } from '@tanstack/react-query';
import { CompassIcon, SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { booksControllerListPublicBooksOptions } from '@/shared/api';
import { DataState } from '@/shared/ui/data-state';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/empty';
import { Input } from '@/shared/ui/input';
import { LibraryBooksSkeleton } from './LibraryBooksSkeleton';
import { PublicLibraryBooks } from './PublicLibraryBooks';

// No existing debounce hook in this app; a short inline one keeps this page
// self-contained instead of adding a shared utility for a single caller.
function useDebouncedValue<Value>(value: Value, delayMs: number): Value {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

export function PublicLibraryPage() {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const booksQuery = useQuery({
    ...booksControllerListPublicBooksOptions({
      query: { limit: 24, search: search || undefined },
    }),
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            <CompassIcon className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('library.browseTitle')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('library.browseDescription')}
            </p>
          </div>
        </div>
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
      </div>

      <div className="mt-8">
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
    </section>
  );
}
