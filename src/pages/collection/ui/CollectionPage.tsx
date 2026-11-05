import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookmarkPlusIcon, BookmarkXIcon, LibraryBigIcon } from 'lucide-react';
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
  type CollectionSummaryResponseDto,
} from '@/shared/api';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DataState } from '@/shared/ui/data-state';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/empty';
import { AddBooksDialog } from './AddBooksDialog';
import { CollectionBookRow } from './CollectionBookRow';
import { CollectionVisibilityToggle } from './CollectionVisibilityToggle';
import { DeleteCollectionButton } from './DeleteCollectionButton';
import { EditCollectionDialog } from './EditCollectionDialog';
import { moveBookId } from '../model/collection-books';

type CollectionPageProps = {
  collectionId: string;
};

export function CollectionPage({ collectionId }: CollectionPageProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const detailQuery = useQuery(
    collectionsControllerGetCollectionOptions({ path: { collectionId } }),
  );
  const reorderBooks = useMutation({
    ...collectionsControllerReorderBooksMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: collectionsControllerGetCollectionQueryKey({
          path: { collectionId },
        }),
      });
    },
  });

  return (
    <DataState query={detailQuery} isEmpty={() => false}>
      {(data) => {
        const { collection, books } = data;

        function handleMove(index: number, direction: -1 | 1) {
          reorderBooks.mutate({
            path: { collectionId },
            body: {
              bookIds: moveBookId(
                books.map((entry) => entry.bookId),
                index,
                direction,
              ),
            },
          });
        }

        return (
          <section className="mx-auto max-w-6xl space-y-6 px-4 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-10">
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

            {reorderBooks.error && (
              <p className="text-sm text-destructive" role="alert">
                {t(getApiErrorTranslationKey(reorderBooks.error))}
              </p>
            )}

            {books.length === 0 ? (
              <Empty className="min-h-64">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <LibraryBigIcon />
                  </EmptyMedia>
                  <EmptyTitle>{t('collection.noBooksTitle')}</EmptyTitle>
                  <EmptyDescription>
                    {collection.isOwner
                      ? t('collection.noBooksOwnerDescription')
                      : t('collection.noBooksDescription')}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ol className="space-y-3">
                {books.map((entry, index) => (
                  <li key={entry.bookId}>
                    <CollectionBookRow
                      index={index}
                      entry={entry}
                      collection={collection}
                      canMoveUp={index > 0}
                      canMoveDown={index < books.length - 1}
                      isReordering={reorderBooks.isPending}
                      onMove={(direction) => handleMove(index, direction)}
                    />
                  </li>
                ))}
              </ol>
            )}
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
