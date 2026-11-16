import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LibraryBigIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collectionsControllerGetCollectionQueryKey,
  collectionsControllerReorderBooksMutation,
  getApiErrorTranslationKey,
  type CollectionBookEntryResponseDto,
  type CollectionSummaryResponseDto,
} from '@/shared/api';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/empty';
import { CollectionBookRow } from './CollectionBookRow';

// Rows move up and down only.
const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

// The collection's books in order; the owner drags a row by its handle (or with
// the keyboard on the handle) to reorder. The new order shows at once and is
// saved; it reverts to the server's order if saving fails.
export function CollectionBookList({
  collection,
  entries,
}: {
  collection: CollectionSummaryResponseDto;
  entries: CollectionBookEntryResponseDto[];
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [order, setOrder] = useState<string[] | null>(null);
  const reorderBooks = useMutation({
    ...collectionsControllerReorderBooksMutation(),
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: collectionsControllerGetCollectionQueryKey({
          path: { collectionId: collection.id },
        }),
      });
      setOrder(null);
    },
  });
  // Touch needs a short drag so scrolling the list still works.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const ids = order ?? entries.map((entry) => entry.bookId);
  const entryById = new Map(entries.map((entry) => [entry.bookId, entry]));

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const next = arrayMove(
      ids,
      ids.indexOf(String(active.id)),
      ids.indexOf(String(over.id)),
    );
    setOrder(next);
    reorderBooks.mutate({
      path: { collectionId: collection.id },
      body: { bookIds: next },
    });
  }

  if (entries.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-3">
      {reorderBooks.error && (
        <p className="text-sm text-destructive" role="alert">
          {t(getApiErrorTranslationKey(reorderBooks.error))}
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol className="space-y-3">
            {ids.map((id, index) => {
              const entry = entryById.get(id);

              return entry ? (
                <CollectionBookRow
                  key={id}
                  index={index}
                  entry={entry}
                  collection={collection}
                />
              ) : null;
            })}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}
