import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useIsland } from '../model/island-context';

// Renders its children inside the island while it is mounted. The owner keeps
// the state and handlers; the island only provides the place and the order.
// `priority` decides where a new item first lands (higher is higher);
// `draggable={false}` pins it above every draggable item.
export function IslandItem({
  id,
  priority = 0,
  draggable = true,
  children,
}: {
  id: string;
  priority?: number;
  draggable?: boolean;
  children: ReactNode;
}) {
  const { target, register, items, topId, collapsed } = useIsland();

  useEffect(
    () => register({ id, priority, draggable }),
    [id, priority, draggable, register],
  );

  const index = items.findIndex((item) => item.id === id);

  return target
    ? createPortal(
        <div
          style={{ order: index }}
          className={index > 0 ? 'border-t border-background/15' : undefined}
          hidden={collapsed && id !== topId}
        >
          {children}
        </div>,
        target,
      )
    : null;
}
