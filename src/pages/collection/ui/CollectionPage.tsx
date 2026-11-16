import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookmarkPlusIcon, BookmarkXIcon, SaveIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collectionsControllerAddToLibraryMutation,
  collectionsControllerGetCollectionOptions,
  collectionsControllerGetCollectionQueryKey,
  collectionsControllerListCollectionsQueryKey,
  collectionsControllerListPublicCollectionsQueryKey,
  collectionsControllerRemoveFromLibraryMutation,
  collectionsControllerReorderBooksMutation,
  getApiErrorTranslationKey,
  type CollectionBookEntryResponseDto,
  type CollectionSummaryResponseDto,
} from '@/shared/api';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DataState } from '@/shared/ui/data-state';
import { Card, CardContent } from '@/shared/ui/card';
import { toast } from '@/shared/ui/toast';
import { AddBooksDialog } from './AddBooksDialog';
import { CollectionBookList } from './CollectionBookList';
import { CollectionVisibilityToggle } from './CollectionVisibilityToggle';
import { DeleteCollectionButton } from './DeleteCollectionButton';
import { EditCollectionDialog } from './EditCollectionDialog';

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

// The loaded collection. Dragging books only changes a draft order; the Save
// button at the top right sends it, and the draft is dropped once it is saved.
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
  const reorderBooks = useMutation({
    ...collectionsControllerReorderBooksMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: collectionsControllerGetCollectionQueryKey({
          path: { collectionId: collection.id },
        }),
      });
      setOrder(null);
      toast.add({ title: t('collection.orderSaved'), type: 'success' });
    },
  });
  const isDirty =
    order !== null &&
    order.join() !== books.map((entry) => entry.bookId).join();

  return (
    <section className="flex w-full flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8 lg:h-[calc(100svh-3.5rem)]">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          {collection.isOwner ? (
            <>
              <AddBooksDialog collection={collection} entries={books} />
              <CollectionVisibilityToggle
                collection={collection}
                entries={books}
              />
              <EditCollectionDialog collection={collection} />
              <DeleteCollectionButton
                collectionId={collection.id}
                title={collection.title}
              />
              <Button
                type="button"
                size="sm"
                className="ml-auto"
                disabled={!isDirty || reorderBooks.isPending}
                onClick={() =>
                  reorderBooks.mutate({
                    path: { collectionId: collection.id },
                    body: { bookIds: order ?? [] },
                  })
                }
              >
                <SaveIcon aria-hidden="true" />
                {reorderBooks.isPending
                  ? t('collection.saving')
                  : t('collection.save')}
              </Button>
            </>
          ) : (
            <SaveCollectionButton collection={collection} />
          )}
        </div>
      </header>

      {reorderBooks.error && (
        <p className="text-sm text-destructive" role="alert">
          {t(getApiErrorTranslationKey(reorderBooks.error))}
        </p>
      )}

      {/* One viewport, no page scroll: the collection's info on the left, the
          books scrolling inside the right one. Same 1:2 split as Home; stacked
          below lg. The scrollbar is hidden so the cards end where the button
          row above ends instead of a scrollbar's width short of it. */}
      <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-rows-[minmax(0,1fr)]">
        <Card className="lg:min-h-0 lg:overflow-y-auto">
          <CardContent className="space-y-3">
            <h1 className="font-heading text-2xl font-semibold tracking-tight break-words">
              {collection.title}
            </h1>
            {collection.description && (
              <p className="text-muted-foreground">{collection.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
          </CardContent>
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
