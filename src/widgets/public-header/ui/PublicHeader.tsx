import { Link } from '@tanstack/react-router';
import { Languages, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/shared/auth';
import { useLocale } from '@/shared/i18n';
import { useTheme } from '@/shared/theme';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { LogoMark } from '@/shared/ui/logo';
import { Separator } from '@/shared/ui/separator';

// TanStack Link sets aria-current="page" on the active link.
const NAV_LINK =
  'text-muted-foreground aria-[current=page]:bg-secondary aria-[current=page]:text-foreground';

export function PublicHeader() {
  const { data, isAuthenticated } = useCurrentUser();
  const email = data?.user.email;
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { locale, toggleLocale } = useLocale();
  const themeLabel = `${t('settings.theme')}: ${
    isDark ? t('settings.dark') : t('settings.light')
  }`;
  const languageLabel = `${t('settings.language')}: ${locale.toUpperCase()}`;

  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <nav
        className="flex h-14 items-center gap-2 pr-4 pl-4 sm:pl-6"
        aria-label={t('header.primaryNavigation')}
      >
        <Link to="/hero" className="mr-auto flex items-center gap-2.5">
          <LogoMark />
          <span className="font-serif text-xl font-medium tracking-[-0.01em] max-sm:sr-only">
            Narrator
          </span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className={`${NAV_LINK} max-sm:hidden`}
          render={<Link to="/about" />}
        >
          {t('navigation.about')}
        </Button>
        {isAuthenticated ? (
          <div className="flex min-w-0 items-center gap-2 px-2 text-sm">
            <Avatar size="sm">
              <AvatarFallback>
                {email?.slice(0, 1).toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-48 truncate font-medium sm:inline">
              {email ?? t('common.account')}
            </span>
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className={NAV_LINK}
              render={<Link to="/login" />}
            >
              {t('auth.signIn')}
            </Button>
            <Button size="sm" render={<Link to="/register" />}>
              {t('auth.createAccount')}
            </Button>
          </>
        )}
        <Separator
          orientation="vertical"
          className="mx-1 h-4 self-center max-sm:hidden"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label={themeLabel}
          title={themeLabel}
        >
          {isDark ? <Moon /> : <Sun />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLocale}
          aria-label={languageLabel}
          title={languageLabel}
        >
          <Languages />
          <span className="max-sm:hidden">{locale.toUpperCase()}</span>
        </Button>
      </nav>
    </header>
  );
}
