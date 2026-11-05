import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  booksControllerListBooksQueryKey,
  booksControllerListPublicBooksOptions,
  booksControllerRemoveFromLibraryMutation,
  collectionsControllerListPublicCollectionsOptions,
  type GhostBookResponseDto,
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
import { CollectionCard } from './CollectionCard';
import { CollectionsTab } from './CollectionsTab';
import { EpubUploadForm } from './EpubUploadForm';
import { GhostCard } from './GhostCard';
import { LibraryBooks } from './LibraryBooks';
import { LibraryBooksSkeleton } from './LibraryBooksSkeleton';
import { PublicLibraryBooks } from './PublicLibraryBooks';

const SOURCE_FILTERS = ['all', 'owned', 'added'] as const;
type SourceFilter = (typeof SOURCE_FILTERS)[number];
const SOURCE_FILTER_LABEL_KEYS: Record<SourceFilter, string> = {
  all: 'library.filterAll',
  owned: 'library.filterOwned',
  added: 'book.publicBadge',
};

export function LibraryPage() {
  const { t } = useTranslation();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('mine');

  function handleUploaded() {
    setIsUploadOpen(false);
    toast.add({ title: t('library.uploadQueued'), type: 'success' });
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-10">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          variant="line"
          className="w-full justify-start border-b group-data-horizontal/tabs:h-11"
        >
          <TabsTrigger value="mine" className="flex-none px-2 py-2.5 text-base">
            {t('library.myLibraryTab')}
          </TabsTrigger>
          <TabsTrigger
            value="collections"
            className="flex-none px-2 py-2.5 text-base"
          >
            {t('library.collectionsTab')}
          </TabsTrigger>
          <TabsTrigger
            value="community"
            className="flex-none px-2 py-2.5 text-base"
          >
            {t('library.communityTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-6">
          <MyLibraryTab
            onAddBook={() => setIsUploadOpen(true)}
            onBrowseCommunity={() => setActiveTab('community')}
          />
        </TabsContent>

        <TabsContent value="collections" className="mt-6">
          <CollectionsTab />
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

function MyLibraryTab({
  onAddBook,
  onBrowseCommunity,
}: {
  onAddBook: () => void;
  onBrowseCommunity: () => void;
}) {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <Button size="sm" onClick={onAddBook}>
          <PlusIcon aria-hidden="true" />
          {t('library.addBook')}
        </Button>
      </div>

      <div className="mt-6">
        <DataState
          query={booksQuery}
          isEmpty={(data) =>
            data.books.length === 0 && data.ghosts.length === 0
          }
          loading={<LibraryBooksSkeleton />}
          empty={
            sourceFilter === 'added' ? (
              <Empty className="min-h-64">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CompassIcon />
                  </EmptyMedia>
                  <EmptyTitle>{t('library.publicEmptyTitle')}</EmptyTitle>
                  <EmptyDescription>
                    {t('library.publicEmptyDescription')}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={onBrowseCommunity}>
                    <CompassIcon />
                    {t('library.browseCommunityBooks')}
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
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
            )
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
              {data.ghosts.length > 0 && (
                <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {data.ghosts.map((ghost) => (
                    <GhostBookCard key={ghost.bookId} ghost={ghost} />
                  ))}
                </div>
              )}
            </div>
          )}
        </DataState>
      </div>
    </div>
  );
}

function GhostBookCard({ ghost }: { ghost: GhostBookResponseDto }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const removeFromLibrary = useMutation({
    ...booksControllerRemoveFromLibraryMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: booksControllerListBooksQueryKey(),
      });
    },
  });

  return (
    <GhostCard
      title={ghost.title}
      description={t('collection.ghostBookDescription')}
      removeLabel={t('collection.removeGhost', { title: ghost.title })}
      isRemoving={removeFromLibrary.isPending}
      onRemove={() =>
        removeFromLibrary.mutate({ path: { bookId: ghost.bookId } })
      }
    />
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

const COMMUNITY_KINDS = ['books', 'collections'] as const;
type CommunityKind = (typeof COMMUNITY_KINDS)[number];
const COMMUNITY_KIND_LABEL_KEYS: Record<CommunityKind, string> = {
  books: 'library.communityBooks',
  collections: 'library.communityCollections',
};

function CommunityLibraryTab() {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const [kind, setKind] = useState<CommunityKind>('books');
  const search = useDebouncedValue(searchInput, 300);
  const booksQuery = useQuery({
    ...booksControllerListPublicBooksOptions({
      query: { limit: 24, search: search || undefined },
    }),
    enabled: kind === 'books',
  });
  const collectionsQuery = useQuery({
    ...collectionsControllerListPublicCollectionsOptions({
      query: { limit: 24, search: search || undefined },
    }),
    enabled: kind === 'collections',
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <fieldset className="flex flex-wrap items-center gap-1">
          <legend className="sr-only">{t('library.communityKindLabel')}</legend>
          {COMMUNITY_KINDS.map((value) => (
            <Button
              key={value}
              type="button"
              variant={kind === value ? 'default' : 'outline'}
              size="sm"
              aria-pressed={kind === value}
              onClick={() => setKind(value)}
            >
              {t(COMMUNITY_KIND_LABEL_KEYS[value])}
            </Button>
          ))}
        </fieldset>
      </div>

      {kind === 'books' ? (
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
      ) : (
        <div className="mt-6">
          <DataState
            query={collectionsQuery}
            isEmpty={(data) => data.collections.length === 0}
            loading={<LibraryBooksSkeleton />}
            empty={
              <Empty className="min-h-64">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CompassIcon />
                  </EmptyMedia>
                  <EmptyTitle>
                    {t('library.browseCollectionsEmptyTitle')}
                  </EmptyTitle>
                  <EmptyDescription>
                    {t('library.browseCollectionsEmptyDescription')}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent />
              </Empty>
            }
          >
            {(data) => (
              <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {data.collections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </div>
            )}
          </DataState>
        </div>
      )}
    </div>
  );
}
