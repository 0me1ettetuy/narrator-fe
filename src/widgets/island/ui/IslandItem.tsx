import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useIsland } from '../model/island-context';

// Renders its children inside the island while it is mounted. The owner keeps
// the state and handlers; the island only provides the place and the stacking.
export function IslandItem({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { target, register } = useIsland();

  useEffect(() => register(id), [id, register]);

  return target ? createPortal(children, target) : null;
}
