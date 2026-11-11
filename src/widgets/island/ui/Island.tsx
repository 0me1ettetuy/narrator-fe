import { ChevronDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { useIsland } from '../model/island-context';

// Floating container at the bottom of the page. It holds whatever is going on
// (a player, generation progress, unsaved changes) as stacked items that pages
// add with <IslandItem> and that leave when the page removes them. The newest
// item is always visible; with more than one, the rest sit behind a toggle.
export function Island() {
  const { t } = useTranslation();
  const { ids, setTarget, collapsed, setCollapsed } = useIsland();
  const hiddenCount = ids.length - 1;

  return (
    <div className="pointer-events-none sticky bottom-4 z-30 h-0">
      <div
        className={cn(
          'pointer-events-auto absolute bottom-0 left-1/2 w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 bg-foreground text-background shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)]',
          ids.length === 0 && 'hidden',
        )}
      >
        {/* Reversed so the newest item (last in the DOM) is on top. */}
        <div
          ref={setTarget}
          className={cn(
            'flex flex-col-reverse divide-y divide-y-reverse divide-background/15',
            collapsed && '[&>*:not(:last-child)]:hidden',
          )}
        />
        {hiddenCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-between text-background hover:bg-background/10 hover:text-background aria-expanded:bg-transparent aria-expanded:hover:bg-background/10"
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed
              ? t('island.more', { count: hiddenCount })
              : t('island.less')}
            <ChevronDownIcon
              className={cn(!collapsed && 'rotate-180')}
              aria-hidden="true"
            />
          </Button>
        )}
      </div>
    </div>
  );
}
