import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/shared/auth';
import { Button } from '@/shared/ui/button';

export function HeroPage() {
  const { data, isAuthenticated } = useCurrentUser();
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-5xl items-center px-4 py-16">
      <section className="max-w-2xl space-y-6">
        <p className="text-sm font-medium text-muted-foreground">Narrator</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {t('hero.title')}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          {isAuthenticated
            ? t('hero.signedInAs', {
                email: data?.user.email ?? t('hero.yourAccount'),
              })
            : t('hero.createAccountDescription')}
        </p>
        {isAuthenticated ? (
          <Button render={<Link to="/home" />}>
            {t('hero.openWorkspace')}
          </Button>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button render={<Link to="/register" />}>
              {t('hero.createAccount')}
            </Button>
            <Button variant="outline" render={<Link to="/login" />}>
              {t('auth.signIn')}
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
