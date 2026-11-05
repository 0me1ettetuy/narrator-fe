import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LibraryBigIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collectionsControllerListCollectionsOptions,
  collectionsControllerListCollectionsQueryKey,
  collectionsControllerRemoveFromLibraryMutation,
} from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { DataState } from '@/shared/ui/data-state';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/empty';
import { CollectionCard } from './CollectionCard';
import { CreateCollectionDialog } from './CreateCollectionDialog';
import { GhostCard } from './GhostCard';
import { LibraryBooksSkeleton } from './LibraryBooksSkeleton';

export function CollectionsTab() {
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const collectionsQuery = useQuery(
    collectionsControllerListCollectionsOptions({
      query: { limit: 50, source: 'all' },
    }),
  );

  return (
    <div>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <PlusIcon aria-hidden="true" />
          {t('collection.create')}
        </Button>
      </div>

      <div className="mt-6">
        <DataState
          query={collectionsQuery}
          isEmpty={(data) =>
            data.collections.length === 0 && data.ghosts.length === 0
          }
          loading={<LibraryBooksSkeleton />}
          empty={
            <Empty className="min-h-64">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LibraryBigIcon />
                </EmptyMedia>
                <EmptyTitle>{t('collection.emptyTitle')}</EmptyTitle>
                <EmptyDescription>
                  {t('collection.emptyDescription')}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <PlusIcon />
                  {t('collection.create')}
                </Button>
              </EmptyContent>
            </Empty>
          }
        >
          {(data) => (
            <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {data.collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
              {data.ghosts.map((ghost) => (
                <CollectionGhostItem key={ghost.collectionId} ghost={ghost} />
              ))}
            </div>
          )}
        </DataState>
      </div>

      <CreateCollectionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}

function CollectionGhostItem({
  ghost,
}: {
  ghost: { collectionId: string; title: string };
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const removeFromLibrary = useMutation({
    ...collectionsControllerRemoveFromLibraryMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: collectionsControllerListCollectionsQueryKey(),
      });
    },
  });

  return (
    <GhostCard
      title={ghost.title}
      description={t('collection.ghostCollectionDescription')}
      removeLabel={t('collection.removeGhost', { title: ghost.title })}
      isRemoving={removeFromLibrary.isPending}
      onRemove={() =>
        removeFromLibrary.mutate({
          path: { collectionId: ghost.collectionId },
        })
      }
    />
  );
}
