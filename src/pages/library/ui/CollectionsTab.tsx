import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collectionsControllerListCollectionsOptions,
  collectionsControllerListCollectionsQueryKey,
  collectionsControllerRemoveFromLibraryMutation,
} from '@/shared/api';
import { CreateCollectionDialog } from '@/features/create-collection';
import { DataState } from '@/shared/ui/data-state';
import { Button } from '@/shared/ui/button';
import { CollectionCard } from './CollectionCard';
import { GhostCard } from './GhostCard';
import { LibraryBooksSkeleton } from './LibraryBooksSkeleton';

export function CollectionsTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const collectionsQuery = useQuery(
    collectionsControllerListCollectionsOptions({
      query: { limit: 50, source: 'all' },
    }),
  );

  return (
    <div>
      {/* Same toolbar row as My library: Create collection at the top right. */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          className="ml-auto"
          onClick={() => setIsCreateOpen(true)}
        >
          <PlusIcon aria-hidden="true" />
          {t('collection.create')}
        </Button>
      </div>
      <DataState
        query={collectionsQuery}
        // Never "empty": with no collections the grid is just empty.
        isEmpty={() => false}
        loading={<LibraryBooksSkeleton portrait />}
      >
        {(data) => (
          <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
            {data.ghosts.map((ghost) => (
              <CollectionGhostItem key={ghost.collectionId} ghost={ghost} />
            ))}
          </div>
        )}
      </DataState>

      <CreateCollectionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={(collection) =>
          navigate({
            to: '/library/collections/$collectionId',
            params: { collectionId: collection.id },
          })
        }
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
