import { Languages, Moon, Settings, Sun, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/shared/i18n';
import { useTheme } from '@/shared/theme';
import { Button } from '@/shared/ui/button';
import { ButtonGroup } from '@/shared/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

export function SidebarSettings() {
  const { isDark, toggleTheme } = useTheme();
  const { locale, toggleLocale } = useLocale();
  const { t } = useTranslation();
  const language = locale.toUpperCase();

  const settings: Array<{
    icon: LucideIcon;
    key: 'theme' | 'language';
    label: string;
    onClick: () => void;
    value: string;
  }> = [
    {
      icon: isDark ? Moon : Sun,
      key: 'theme',
      label: t('settings.theme'),
      onClick: toggleTheme,
      value: isDark ? t('settings.dark') : t('settings.light'),
    },
    {
      icon: Languages,
      key: 'language',
      label: t('settings.language'),
      onClick: toggleLocale,
      value: language,
    },
  ];

  // Like UserCard: the row keeps its expanded width and the wrapper clips it, so
  // it never overflows while the sidebar is still opening.
  return (
    <div className="relative mt-2 overflow-hidden">
      <ButtonGroup className="w-[calc(var(--sidebar-width)-1rem-1px)] border-t pt-2 transition-[visibility] duration-200 group-data-[collapsible=icon]:invisible">
        {settings.map(({ icon: Icon, key, label, onClick, value }) => (
          <Button
            key={key}
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onClick}
            aria-label={`${label}: ${value}`}
          >
            <Icon />
            <span>{value}</span>
          </Button>
        ))}
      </ButtonGroup>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className="absolute top-[9px] left-1/2 hidden -translate-x-1/2 group-data-[collapsible=icon]:inline-flex"
              aria-label={t('settings.open')}
            >
              <Settings />
            </Button>
          }
        />
        <DropdownMenuContent side="right" align="end" className="w-40">
          {settings.map(({ icon: Icon, key, label, onClick, value }) => (
            <DropdownMenuItem key={key} onClick={onClick}>
              <Icon />
              <span>{label}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {value}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
