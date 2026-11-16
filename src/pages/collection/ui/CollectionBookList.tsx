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

// The collection's books in order; the owner drags a card (or uses the keyboard
// on its grip) to reorder. That only changes the draft order the page holds.
export function CollectionBookList({
  collection,
  entries,
  order,
  onReorder,
}: {
  collection: CollectionSummaryResponseDto;
  entries: CollectionBookEntryResponseDto[];
  // The draft order, or null while nothing has been moved.
  order: string[] | null;
  onReorder: (order: string[]) => void;
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
  const entryById = new Map(entries.map((entry) => [entry.bookId, entry]));
  // The draft, kept in step with the books: ones that are gone drop out, ones
  // added since go last.
  const ids = [
    ...(order ?? []).filter((id) => entryById.has(id)),
    ...entries
      .map((entry) => entry.bookId)
      .filter((id) => !order?.includes(id)),
  ];

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
