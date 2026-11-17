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
      {/* One frame for the text and the shelf below it; from lg the title sits
          left and the sentence with the action sits right, on the same baseline. */}
      <section className="mx-auto flex w-full max-w-[90rem] basis-[44%] flex-col justify-end px-4 py-6 sm:basis-[38%] sm:px-8 sm:py-10">
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end lg:gap-x-16">
          <div className="flex flex-col gap-4">
            <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
              {t('hero.eyebrow')}
            </span>
            <h1 className="max-w-3xl text-4xl text-balance leading-[1.04] font-medium tracking-[-0.02em] sm:text-[52px] lg:text-[clamp(3.25rem,4.6vw,4.5rem)]">
              {t('hero.titleLead')}{' '}
              <span className="font-serif font-normal text-brand italic">
                {t('hero.titleAccent')}
              </span>
            </h1>
          </div>
          <div className="flex flex-col gap-4 lg:pb-2">
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
          </div>
        </div>
      </section>
      {/* Decorative: the books are samples, not content. */}
      <section
        className="relative min-h-0 flex-1 overflow-hidden"
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
