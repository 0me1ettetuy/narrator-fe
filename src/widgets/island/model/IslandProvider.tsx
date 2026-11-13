import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { IslandContext } from './island-context';
import { insertEntry, moveEntry, type OrderEntry } from './island-order';

export function IslandProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [items, setItems] = useState<OrderEntry[]>([]);
  const [collapsed, setCollapsed] = useState(true);

  const register = useCallback((entry: OrderEntry) => {
    setItems((current) => insertEntry(current, entry));
    return () =>
      setItems((current) => current.filter((item) => item.id !== entry.id));
  }, []);

  const move = useCallback((id: string, toIndex: number) => {
    setItems((current) => moveEntry(current, id, toIndex));
  }, []);

  // Touch needs a short press so scrolling the page still works.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortableIds = useMemo(
    () => items.filter((item) => item.draggable).map((item) => item.id),
    [items],
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const toIndex = items.findIndex((item) => item.id === over.id);
    if (toIndex !== -1) move(String(active.id), toIndex);
  };

  const value = useMemo(
    () => ({
      target,
      setTarget,
      items,
      topId: items[0]?.id ?? null,
      register,
      move,
      collapsed,
      setCollapsed,
    }),
    [target, items, register, move, collapsed],
  );

  return (
    <IslandContext.Provider value={value}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements: {
            onDragStart: () => '',
            onDragOver: () => '',
            onDragCancel: () => '',
            onDragEnd: ({ over }) =>
              over
                ? t('island.movedTo', {
                    position:
                      items.findIndex((item) => item.id === over.id) + 1,
                  })
                : '',
          },
        }}
      >
        <SortableContext
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          {children}
        </SortableContext>
      </DndContext>
    </IslandContext.Provider>
  );
}
