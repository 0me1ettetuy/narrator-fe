import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
import { LibraryBigIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
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

// The collection's books in the draft order; the owner drags a card (or uses the
// keyboard on it) to reorder or removes one. That only changes the page's draft.
export function CollectionBookList({
  collection,
  entries,
  onReorder,
  onRemove,
}: {
  collection: CollectionSummaryResponseDto;
  // The books in the draft order.
  entries: CollectionBookEntryResponseDto[];
  onReorder: (bookIds: string[]) => void;
  onRemove: (bookId: string) => void;
}) {
  const { t } = useTranslation();
  // The whole card drags, so a click on its link or buttons must still work (a
  // few px of movement first) and touch needs a short press so the list scrolls.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const ids = entries.map((entry) => entry.bookId);

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    onReorder(
      arrayMove(
        ids,
        ids.indexOf(String(active.id)),
        ids.indexOf(String(over.id)),
      ),
    );
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol className="space-y-3">
            {entries.map((entry, index) => (
              <CollectionBookRow
                key={entry.bookId}
                index={index}
                entry={entry}
                collection={collection}
                onRemove={() => onRemove(entry.bookId)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}
