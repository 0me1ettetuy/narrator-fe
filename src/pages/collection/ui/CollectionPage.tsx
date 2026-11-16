import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookmarkPlusIcon, BookmarkXIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  collectionsControllerAddToLibraryMutation,
  collectionsControllerGetCollectionOptions,
  collectionsControllerGetCollectionQueryKey,
  collectionsControllerListCollectionsQueryKey,
  collectionsControllerListPublicCollectionsQueryKey,
  collectionsControllerRemoveFromLibraryMutation,
  type CollectionSummaryResponseDto,
} from '@/shared/api';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DataState } from '@/shared/ui/data-state';
import { Card } from '@/shared/ui/card';
import { AddBooksDialog } from './AddBooksDialog';
import { CollectionBookList } from './CollectionBookList';
import { CollectionVisibilityToggle } from './CollectionVisibilityToggle';
import { DeleteCollectionButton } from './DeleteCollectionButton';
import { EditCollectionDialog } from './EditCollectionDialog';

type CollectionPageProps = {
  collectionId: string;
};

export function CollectionPage({ collectionId }: CollectionPageProps) {
  const { t } = useTranslation();
  const detailQuery = useQuery(
    collectionsControllerGetCollectionOptions({ path: { collectionId } }),
  );

  return (
    <DataState query={detailQuery} isEmpty={() => false}>
      {(data) => {
        const { collection, books } = data;

        return (
          <section className="flex w-full flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8 lg:h-[calc(100svh-3.5rem)]">
            <header className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <h1 className="font-heading text-2xl font-semibold tracking-tight break-words">
                    {collection.title}
                  </h1>
                  {collection.description && (
                    <p className="text-muted-foreground">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge
                      variant={
                        collection.visibility === 'PUBLIC'
                          ? 'secondary'
                          : 'outline'
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
                </div>
              </div>

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
                  </>
                ) : (
                  <SaveCollectionButton collection={collection} />
                )}
              </div>
            </header>

            {/* One viewport, no page scroll: the left section is empty for now, the
                books scroll inside the right one. Same 1:2 split as Home; stacked
                below lg, where the empty section is hidden. */}
            <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-rows-[minmax(0,1fr)]">
              <Card className="max-lg:hidden lg:min-h-0" aria-hidden="true" />
              {/* p-px keeps the rows' 1px rings from being clipped by the scroll box. */}
              <div className="p-px lg:min-h-0 lg:overflow-y-auto">
                <CollectionBookList collection={collection} entries={books} />
              </div>
            </div>
          </section>
        );
      }}
    </DataState>
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
