import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { CompassIcon, SearchIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerListBooksOptions,
  booksControllerListBooksQueryKey,
  booksControllerListPublicBooksOptions,
  booksControllerRemoveFromLibraryMutation,
  collectionsControllerListPublicCollectionsOptions,
  type BookSummaryResponseDto,
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
  added: 'library.filterAdded',
};

export function LibraryPage() {
  const { t } = useTranslation();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState('mine');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  // Counts come from the shared "all" list (one request with the header), so
  // they cover only the books that list returns, not the whole library.
  const { data: allBooks } = useLibraryBooks('all');
  const counts: Record<SourceFilter, number | undefined> = {
    all: allBooks?.books.length,
    owned: allBooks?.books.filter((book) => book.isOwner).length,
    added: allBooks?.books.filter((book) => !book.isOwner).length,
  };

  function openUpload(files: File[]) {
    setDroppedFiles(files);
    setIsUploadOpen(true);
  }

  function handleUploaded() {
    setIsUploadOpen(false);
    toast.add({ title: t('library.uploadQueued'), type: 'success' });
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-10">
      <LibraryHeader />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0">
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

        {/* No flex gap or panel margin: a panel that is still unmounting is an
            extra flex child, and either would push the new tab down until it
            goes. The spacing lives on the inner wrapper (mt-8 = old gap + mt-6). */}
        <TabsContent value="mine">
          {activeTab === 'mine' && (
            <div className="mt-8">
              <fieldset className="mb-6 flex flex-wrap items-center gap-1">
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
                    {counts[value] !== undefined && (
                      <span className="ml-1.5 tabular-nums opacity-60">
                        {counts[value]}
                      </span>
                    )}
                  </Button>
                ))}
              </fieldset>
              <MyLibraryTab
                sourceFilter={sourceFilter}
                onAdd={openUpload}
                onBrowseCommunity={() => setActiveTab('community')}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="collections">
          {activeTab === 'collections' && (
            <div className="mt-8">
              <CollectionsTab />
            </div>
          )}
        </TabsContent>

        <TabsContent value="community">
          {activeTab === 'community' && (
            <div className="mt-8">
              <CommunityLibraryTab />
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('library.uploadTitle')}</DialogTitle>
            <DialogDescription>
              {t('library.uploadDescription')}
            </DialogDescription>
          </DialogHeader>
          <EpubUploadForm
            initialFiles={droppedFiles}
            onUploaded={handleUploaded}
            onCancel={() => setIsUploadOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}

function isParsing(book: BookSummaryResponseDto) {
  return (
    book.parseStatus === 'UPLOADING' ||
    book.parseStatus === 'QUEUED' ||
    book.parseStatus === 'PROCESSING'
  );
}

// Polls every 3s while any book is still parsing. The header and the tab share
// the "all" query key, so that case is one request.
function useLibraryBooks(source: SourceFilter) {
  return useQuery({
    ...booksControllerListBooksOptions({ query: { limit: 20, source } }),
    refetchInterval: (query) =>
      query.state.data?.books.some(isParsing) ? 3_000 : false,
  });
}

function LibraryHeader() {
  const { t } = useTranslation();
  const { data } = useLibraryBooks('all');
  const processing = data?.books.filter(isParsing).length ?? 0;

  return (
    <header className="mb-10 flex max-w-[620px] flex-col gap-3.5">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-heading text-4xl leading-none font-medium tracking-[-0.03em] sm:text-[56px]">
          {t('library.pageTitle')}
        </h1>
        {data && (
          <span className="text-sm text-muted-foreground">
            {t('library.bookCount', { count: data.books.length })}
            {processing > 0 && (
              <>
                {' · '}
                <span className="text-destructive-text">
                  {t('library.processingCount', { count: processing })}
                </span>
              </>
            )}
          </span>
        )}
      </div>
      <p className="font-serif text-[17px] leading-normal text-muted-foreground">
        {t('library.pageIntro')}
      </p>
    </header>
  );
}

function MyLibraryTab({
  sourceFilter,
  onAdd,
  onBrowseCommunity,
}: {
  sourceFilter: SourceFilter;
  onAdd: (files: File[]) => void;
  onBrowseCommunity: () => void;
}) {
  const { t } = useTranslation();
  const booksQuery = useLibraryBooks(sourceFilter);

  return (
    <DataState
      query={booksQuery}
      // An empty "all"/"owned" list still shows the add card; only "added"
      // (books from the community) has a dedicated empty state.
      isEmpty={(data) =>
        sourceFilter === 'added' &&
        data.books.length === 0 &&
        data.ghosts.length === 0
      }
      loading={<LibraryBooksSkeleton portrait />}
      empty={
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
      }
    >
      {(data) => (
        <div className="space-y-5">
          <LibraryBooks
            books={data.books}
            onAdd={sourceFilter === 'added' ? undefined : onAdd}
          />
          {data.ghosts.length > 0 && (
            <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.ghosts.map((ghost) => (
                <GhostBookCard key={ghost.bookId} ghost={ghost} />
              ))}
            </div>
          )}
        </div>
      )}
    </DataState>
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
              <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
