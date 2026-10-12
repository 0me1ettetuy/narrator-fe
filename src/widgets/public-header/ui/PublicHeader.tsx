import { useCurrentUser } from '@/shared/auth';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Separator } from '@/shared/ui/separator';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export function PublicHeader() {
  const { data, isAuthenticated } = useCurrentUser();
  const email = data?.user.email;
  const { t } = useTranslation();

  return (
    <header className="border-b">
      <nav
        className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4"
        aria-label={t('header.primaryNavigation')}
      >
        <Link to="/hero" className="mr-auto font-semibold">
          Narrator
        </Link>
        <Link to="/about" className="text-sm text-muted-foreground">
          {t('navigation.about')}
        </Link>
        {isAuthenticated ? (
          <>
            <Separator orientation="vertical" className="my-3" />
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <Avatar className="size-7">
                <AvatarFallback>
                  {email?.slice(0, 1).toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-48 truncate font-medium">
                {email ?? t('common.account')}
              </span>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-muted-foreground">
              {t('auth.signIn')}
            </Link>
            <Link to="/register" className="text-sm font-medium">
              {t('auth.createAccount')}
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
