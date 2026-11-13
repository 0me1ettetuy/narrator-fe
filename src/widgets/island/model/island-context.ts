import { createContext, useContext } from 'react';
import type { OrderEntry } from './island-order';

export type IslandContextValue = {
  /** DOM node the island renders its items into; items portal into it. */
  target: HTMLElement | null;
  setTarget: (node: HTMLElement | null) => void;
  /** Mounted items in priority order; the first is shown while collapsed and sits at the bottom of the island. */
  items: OrderEntry[];
  /** Id of the first item: the one shown while the island is collapsed. */
  topId: string | null;
  /** Adds an item and returns the function that removes it. */
  register: (entry: OrderEntry) => () => void;
  /** Moves a draggable item to a position in `items`. */
  move: (id: string, toIndex: number) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

export const IslandContext = createContext<IslandContextValue | null>(null);

export function useIsland() {
  const context = useContext(IslandContext);

  if (!context) {
    throw new Error('useIsland must be used inside IslandProvider');
  }

  return context;
}
