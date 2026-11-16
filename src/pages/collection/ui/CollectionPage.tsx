import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookmarkPlusIcon, BookmarkXIcon, SaveIcon } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collectionsControllerAddToLibraryMutation,
  collectionsControllerGetCollectionOptions,
  collectionsControllerGetCollectionQueryKey,
  collectionsControllerListCollectionsQueryKey,
  collectionsControllerListPublicCollectionsQueryKey,
  collectionsControllerRemoveFromLibraryMutation,
  collectionsControllerReorderBooksMutation,
  collectionsControllerUpdateCollectionMutation,
  getApiErrorTranslationKey,
  type CollectionBookEntryResponseDto,
  type CollectionSummaryResponseDto,
} from '@/shared/api';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DataState } from '@/shared/ui/data-state';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Card, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { toast } from '@/shared/ui/toast';
import { preloadBook3D } from '@/entities/book';
import { AddBooksDialog } from './AddBooksDialog';
import { CollectionBookList } from './CollectionBookList';
import { CollectionVisibilityToggle } from './CollectionVisibilityToggle';
import { DeleteCollectionButton } from './DeleteCollectionButton';

// three.js is heavy: the pile loads when the page opens, and the chunk starts
// downloading with it.
const loadPile = () => import('./CollectionBookPile');
const CollectionBookPile = lazy(loadPile);
void loadPile();
preloadBook3D();

type CollectionPageProps = {
  collectionId: string;
};

export function CollectionPage({ collectionId }: CollectionPageProps) {
  const detailQuery = useQuery(
    collectionsControllerGetCollectionOptions({ path: { collectionId } }),
  );

  return (
    <DataState query={detailQuery} isEmpty={() => false}>
      {(data) => (
        <CollectionLoaded collection={data.collection} books={data.books} />
      )}
    </DataState>
  );
}

// The loaded collection. Everything the owner changes here (the book order, the
// title, the description) is a draft until the Save button sends it; the drafts
// are dropped once it is saved.
function CollectionLoaded({
  collection,
  books,
}: {
  collection: CollectionSummaryResponseDto;
  books: CollectionBookEntryResponseDto[];
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [order, setOrder] = useState<string[] | null>(null);
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState<string | null>(null);
  const title = titleDraft ?? collection.title;
  const description = descriptionDraft ?? collection.description ?? '';
  const isTitleValid = title.trim().length > 0;
  const isOrderDirty =
    order !== null &&
    order.join() !== books.map((entry) => entry.bookId).join();
  const isTextDirty =
    title.trim() !== collection.title ||
    description.trim() !== (collection.description ?? '');
  const isDirty = (isOrderDirty || isTextDirty) && isTitleValid;
  const updateCollection = useMutation(
    collectionsControllerUpdateCollectionMutation(),
  );
  const reorderBooks = useMutation(collectionsControllerReorderBooksMutation());
  const isSaving = updateCollection.isPending || reorderBooks.isPending;
  const error = updateCollection.error ?? reorderBooks.error;

  async function save() {
    try {
      if (isTextDirty) {
        await updateCollection.mutateAsync({
          path: { collectionId: collection.id },
          body: {
            title: title.trim(),
            description: description.trim() || null,
          },
        });
      }
      if (isOrderDirty) {
        await reorderBooks.mutateAsync({
          path: { collectionId: collection.id },
          body: { bookIds: order ?? [] },
        });
      }
    } catch {
      // Shown below from the mutation's error.
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: collectionsControllerGetCollectionQueryKey({
          path: { collectionId: collection.id },
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: collectionsControllerListCollectionsQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: collectionsControllerListPublicCollectionsQueryKey(),
      }),
    ]);
    setOrder(null);
    setTitleDraft(null);
    setDescriptionDraft(null);
    toast.add({ title: t('collection.changesSaved'), type: 'success' });
  }

  return (
    <section className="flex w-full flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8 lg:h-[calc(100svh-3.5rem)]">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          {collection.isOwner ? (
            <>
              <AddBooksDialog collection={collection} entries={books} />
              <DeleteCollectionButton
                collectionId={collection.id}
                title={collection.title}
              />
              <Button
                type="button"
                size="sm"
                className="ml-auto"
                disabled={!isDirty || isSaving}
                onClick={() => void save()}
              >
                <SaveIcon aria-hidden="true" />
                {isSaving ? t('collection.saving') : t('collection.save')}
              </Button>
            </>
          ) : (
            <SaveCollectionButton collection={collection} />
          )}
        </div>
      </header>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {t(getApiErrorTranslationKey(error))}
        </p>
      )}

      {/* One viewport, no page scroll: the collection on the left (visibility,
          title, the books as a pile, description), the books scrolling inside
          the right one. Same 1:2 split as Home; stacked below lg. The scrollbar
          is hidden so the cards end where the button row above ends. */}
      <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-rows-[minmax(0,1fr)]">
        <Card className="lg:min-h-0 lg:overflow-y-auto">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  collection.visibility === 'PUBLIC' ? 'secondary' : 'outline'
                }
              >
                {collection.visibility === 'PUBLIC'
                  ? t('book.publicBadge')
                  : t('collection.privateBadge')}
              </Badge>
              <span>
                {t('library.bookCount', { count: collection.bookCount })}
              </span>
            </div>
            {collection.isOwner && (
              <CollectionVisibilityToggle
                collection={collection}
                entries={books}
              />
            )}
          </CardContent>
          <CardContent className="space-y-2">
            {collection.isOwner ? (
              <>
                <h1 className="sr-only">{collection.title}</h1>
                <Label htmlFor="collection-title">
                  {t('collection.titleLabel')}
                </Label>
                <Input
                  id="collection-title"
                  value={title}
                  maxLength={200}
                  aria-invalid={!isTitleValid}
                  disabled={isSaving}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur();
                  }}
                />
                {!isTitleValid && (
                  <p className="text-xs text-destructive" role="alert">
                    {t('collection.titleRequired')}
                  </p>
                )}
              </>
            ) : (
              <h1 className="font-heading text-2xl font-semibold tracking-tight break-words">
                {collection.title}
              </h1>
            )}
          </CardContent>
          {/* The books as a pile seen from the side; three.js loads on demand. */}
          <CardContent className="min-h-0 flex-1">
            <Suspense fallback={<Skeleton className="size-full min-h-64" />}>
              <CollectionBookPile entries={books} />
            </Suspense>
          </CardContent>
          {collection.isOwner ? (
            <CardContent className="space-y-2">
              <Label htmlFor="collection-description">
                {t('collection.descriptionLabel')}
              </Label>
              <Textarea
                id="collection-description"
                value={description}
                maxLength={1000}
                rows={4}
                disabled={isSaving}
                onChange={(event) => setDescriptionDraft(event.target.value)}
              />
            </CardContent>
          ) : (
            collection.description && (
              <CardContent>
                <p className="text-muted-foreground">
                  {collection.description}
                </p>
              </CardContent>
            )
          )}
        </Card>
        {/* p-px keeps the rows' 1px rings from being clipped by the scroll box. */}
        <div className="p-px lg:min-h-0 lg:overflow-y-auto lg:[scrollbar-width:none]">
          <CollectionBookList
            collection={collection}
            entries={books}
            order={order}
            onReorder={setOrder}
          />
        </div>
      </div>
    </section>
  );
}

// Duplicates the save toggle in CollectionCard: pages can't import each other.
function SaveCollectionButton({
  collection,
}: {
  collection: CollectionSummaryResponseDto;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: collectionsControllerGetCollectionQueryKey({
          path: { collectionId: collection.id },
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: collectionsControllerListCollectionsQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: collectionsControllerListPublicCollectionsQueryKey(),
      }),
    ]);
  };
  const save = useMutation({
    ...collectionsControllerAddToLibraryMutation(),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    ...collectionsControllerRemoveFromLibraryMutation(),
    onSuccess: invalidate,
  });
  const isPending = save.isPending || remove.isPending;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        collection.isAdded
          ? remove.mutate({ path: { collectionId: collection.id } })
          : save.mutate({ path: { collectionId: collection.id } })
      }
    >
      {collection.isAdded ? (
        <BookmarkXIcon aria-hidden="true" />
      ) : (
        <BookmarkPlusIcon aria-hidden="true" />
      )}
      {collection.isAdded
        ? t('collection.removeFromLibrary')
        : t('collection.saveToLibrary')}
    </Button>
  );
}
