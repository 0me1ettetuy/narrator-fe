import { createContext, useContext } from 'react';

export type IslandContextValue = {
  /** DOM node the island renders its items into; items portal into it. */
  target: HTMLElement | null;
  setTarget: (node: HTMLElement | null) => void;
  /** Ids of the mounted items, in the order they were added. */
  ids: string[];
  /** Adds an item and returns the function that removes it. */
  register: (id: string) => () => void;
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
