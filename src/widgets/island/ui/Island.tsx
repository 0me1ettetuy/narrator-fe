import { ChevronDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { useIsland } from '../model/island-context';

// Floating container at the bottom of the page. It holds whatever is going on
// (a player, generation progress, unsaved changes) as stacked items that pages
// add with <IslandItem> and that leave when the page removes them.
export function Island() {
  const { t } = useTranslation();
  const { ids, setTarget, collapsed, setCollapsed } = useIsland();
  const label = collapsed ? t('island.expand') : t('island.collapse');

  return (
    <div className="pointer-events-none sticky bottom-4 z-30 h-0">
      <div
        className={cn(
          'pointer-events-auto absolute bottom-0 left-1/2 w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 bg-foreground text-background shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)]',
          ids.length === 0 && 'hidden',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between px-4 py-1',
            !collapsed && 'border-b border-background/15',
          )}
        >
          <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.06em] uppercase">
            {t('island.activity')}
            <span className="tabular-nums opacity-65">{ids.length}</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-background hover:bg-background/10 hover:text-background aria-expanded:bg-transparent aria-expanded:hover:bg-background/10"
            aria-expanded={!collapsed}
            aria-label={label}
            title={label}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronDownIcon
              className={cn(collapsed && 'rotate-180')}
              aria-hidden="true"
            />
          </Button>
        </div>
        <div
          ref={setTarget}
          className={cn('divide-y divide-background/15', collapsed && 'hidden')}
        />
      </div>
    </div>
  );
}
