import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVerticalIcon } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { useIsland } from '../model/island-context';

// Renders its children inside the island while it is mounted. The owner keeps
// the state and handlers; the island only provides the place and the order.
// `priority` decides where a new item first lands (higher is higher);
// `draggable={false}` pins it above every draggable item. `label` names the
// item for the drag handle.
export function IslandItem({
  id,
  priority = 0,
  draggable = true,
  label,
  children,
}: {
  id: string;
  priority?: number;
  draggable?: boolean;
  label?: string;
  children: ReactNode;
}) {
  const { target, register, items, topId, collapsed } = useIsland();

  useEffect(
    () => register({ id, priority, draggable }),
    [id, priority, draggable, register],
  );

  const index = items.findIndex((item) => item.id === id);
  const draggableCount = items.filter((item) => item.draggable).length;
  const shellProps = {
    id,
    index,
    hidden: collapsed && id !== topId,
    children,
  };

  if (!target) return null;

  return createPortal(
    draggable && draggableCount > 1 && !collapsed ? (
      <SortableShell {...shellProps} label={label ?? id} />
    ) : (
      <div
        style={{ order: index }}
        className={index > 0 ? 'border-b border-background/15' : undefined}
        hidden={shellProps.hidden}
      >
        {children}
      </div>
    ),
    target,
  );
}

function SortableShell({
  id,
  index,
  hidden,
  label,
  children,
}: {
  id: string;
  index: number;
  hidden: boolean;
  label: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const text = t('island.dragHandle', { title: label });

  return (
    <div
      ref={setNodeRef}
      style={{
        order: index,
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={
        index > 0
          ? 'relative flex items-center border-b border-background/15 bg-foreground'
          : 'relative flex items-center bg-foreground'
      }
      data-dragging={isDragging || undefined}
      hidden={hidden}
    >
      <Button
        ref={setActivatorNodeRef}
        type="button"
        variant="ghost"
        size="icon-xs"
        className="ml-4 shrink-0 cursor-grab touch-none text-background hover:bg-background/10 hover:text-background"
        aria-label={text}
        title={text}
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon aria-hidden="true" />
      </Button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
