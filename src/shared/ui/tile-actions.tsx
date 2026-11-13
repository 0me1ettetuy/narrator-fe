import type { ReactNode } from 'react';

// Square paper buttons laid over the top-right of a cover tile. The tile must
// be `group/tile relative`. Hidden until the tile is hovered or focused where
// there is hover (and while a menu in it is open); always visible on touch.
export const tileButtonClass =
  'border-transparent bg-card text-foreground backdrop-blur-none hover:border-transparent hover:bg-secondary';

export function TileActions({ children }: { children: ReactNode }) {
  return (
    <div className="absolute top-2 right-2 z-10 flex gap-1 transition-opacity focus-within:opacity-100 has-[[data-popup-open]]:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/tile:opacity-100">
      {children}
    </div>
  );
}
