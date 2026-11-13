import { ChevronDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { useIsland } from '../model/island-context';

// Floating container at the bottom of the page. It holds whatever is going on
// (a player, generation progress, unsaved changes) as stacked items that pages
// add with <IslandItem> and that leave when the page removes them. The first item
// (shown at the bottom) is always visible; with more than one, the rest sit above it behind a toggle that stays put at the bottom.
export function Island() {
  const { t } = useTranslation();
  const { items, setTarget, collapsed, setCollapsed } = useIsland();
  const hiddenCount = items.length - 1;

  return (
    <div className="pointer-events-none sticky bottom-4 z-30 h-0">
      <div
        className={cn(
          'pointer-events-auto absolute bottom-0 left-1/2 w-[min(48rem,calc(100%-2rem))] -translate-x-1/2 bg-foreground text-background shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)]',
          items.length === 0 && 'hidden',
        )}
      >
        {/* Reversed: the first item (the one shown when collapsed) is at the bottom, so it keeps its place when the island expands upward. */}
        <div ref={setTarget} className="flex flex-col-reverse" />
        {hiddenCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-between border-t border-background/15 text-background hover:bg-background/10 hover:text-background aria-expanded:bg-transparent aria-expanded:hover:bg-background/10"
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed
              ? t('island.more', { count: hiddenCount })
              : t('island.less')}
            <ChevronDownIcon
              className={cn(collapsed && 'rotate-180')}
              aria-hidden="true"
            />
          </Button>
        )}
      </div>
    </div>
  );
}
