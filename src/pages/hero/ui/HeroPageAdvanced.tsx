import { lazy, Suspense } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/shared/auth';
import { Button } from '@/shared/ui/button';

// three.js is heavy: the shelf loads after the first paint of the text.
const HeroShelf = lazy(() => import('./HeroShelf'));

export function HeroPageAdvanced() {
  const { data, isAuthenticated } = useCurrentUser();
  const { t } = useTranslation();

  return (
    <main className="flex h-[calc(100svh-3.5rem)] flex-col overflow-hidden">
      <section className="mx-auto flex w-full max-w-6xl basis-[44%] flex-col justify-end gap-4 px-4 py-6 sm:basis-[38%] sm:px-8 sm:py-10">
        <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {t('hero.eyebrow')}
        </span>
        <h1 className="max-w-125 text-4xl leading-[1.04] font-medium tracking-[-0.02em] sm:text-[52px]">
          {t('hero.titleLead')}{' '}
          <span className="font-serif font-normal text-brand italic">
            {t('hero.titleAccent')}
          </span>
        </h1>
        <p className="max-w-110 font-serif text-lg leading-normal text-muted-foreground">
          {isAuthenticated
            ? t('hero.signedInAs', {
                email: data?.user.email ?? t('hero.yourAccount'),
              })
            : t('hero.description')}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            render={<Link to={isAuthenticated ? '/home' : '/register'} />}
          >
            {isAuthenticated
              ? t('hero.openWorkspace')
              : t('hero.createAccount')}
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </div>
      </section>
      {/* Decorative: the books are samples, not content. */}
      <section
        className="relative min-h-0 flex-1 overflow-hidden bg-secondary"
        role="img"
        aria-label={t('heroAdvanced.label')}
      >
        <Suspense fallback={null}>
          <HeroShelf />
        </Suspense>
      </section>
    </main>
  );
}
