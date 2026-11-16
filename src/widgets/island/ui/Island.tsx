import { ChevronDownIcon, GripVerticalIcon } from 'lucide-react';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { useIsland } from '../model/island-context';

// Floating container stuck to the bottom or the top of the page; drag the grip
// on its right edge (or press Up/Down on it) to move it. It holds whatever is going on
// (a player, generation progress, unsaved changes) as stacked items that pages
// add with <IslandItem> and that leave when the page removes them. The first item
// is always visible: at the bottom it is the lowest and the rest grow upward,
// at the top it is the highest and the rest grow downward. With more than one,
// the rest sit behind a toggle on the far side of the first item.
export function Island() {
  const { t } = useTranslation();
  const { items, setTarget, collapsed, setCollapsed, placement, setPlacement } =
    useIsland();
  const hiddenCount = items.length - 1;
  const isTop = placement === 'top';
  // Pointer start while dragging, and how far the island follows it.
  const dragStart = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  function endDrag(event: PointerEvent<HTMLButtonElement>, drop: boolean) {
    if (dragStart.current === null) return;
    dragStart.current = null;
    setDragOffset(0);
    // Snap to whichever half of the screen it was dropped in.
    if (drop)
      setPlacement(event.clientY < window.innerHeight / 2 ? 'top' : 'bottom');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    setPlacement(event.key === 'ArrowUp' ? 'top' : 'bottom');
  }

  return (
    <div className="pointer-events-none sticky bottom-4 z-30 h-0">
      <div
        style={{ transform: `translateY(${dragOffset}px)` }}
        className={cn(
          'pointer-events-auto absolute left-1/2 flex w-[min(48rem,calc(100%-2rem))] -translate-x-1/2 bg-foreground text-background shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)]',
          // The wrapper sits 1rem above the screen bottom; the top slot is 1rem under the 3.5rem header.
          isTop
            ? 'top-[calc(5.5rem-100svh)] flex-col-reverse'
            : 'bottom-0 flex-col',
          items.length === 0 && 'hidden',
        )}
      >
        <Button
          type="button"
          variant="ghost"
          // Items have 16px side padding, so this strip covers none of their buttons.
          className="absolute inset-y-0 right-0 z-10 h-auto w-4 cursor-grab touch-none rounded-none p-0 text-background/60 transition-none hover:bg-transparent hover:text-background/60"
          aria-label={t('island.move')}
          title={t('island.move')}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            dragStart.current = event.clientY;
          }}
          onPointerMove={(event) => {
            if (dragStart.current !== null)
              setDragOffset(event.clientY - dragStart.current);
          }}
          onPointerUp={(event) => endDrag(event, true)}
          onPointerCancel={(event) => endDrag(event, false)}
          onKeyDown={handleKeyDown}
        >
          <GripVerticalIcon className="size-3.5" aria-hidden="true" />
        </Button>
        {/* At the bottom the list is reversed: the first item is the lowest, so it keeps its place when the island expands upward. At the top it reads downward. */}
        <div
          ref={setTarget}
          className={cn('flex', isTop ? 'flex-col' : 'flex-col-reverse')}
        />
        {hiddenCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'w-full justify-between border-background/15 text-background hover:bg-background/10 hover:text-background aria-expanded:bg-transparent aria-expanded:hover:bg-background/10',
              isTop ? 'border-b' : 'border-t',
            )}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed
              ? t('island.more', { count: hiddenCount })
              : t('island.less')}
            <ChevronDownIcon
              className={cn(collapsed !== isTop && 'rotate-180')}
              aria-hidden="true"
            />
          </Button>
        )}
      </div>
    </div>
  );
}
