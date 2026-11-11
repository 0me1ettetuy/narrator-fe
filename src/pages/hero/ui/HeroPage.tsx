import { Link } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import heroImage from '../assets/hero.jpg';

const STEPS = ['upload', 'fix', 'pick', 'generate'] as const;

export function HeroPage() {
  const { data, isAuthenticated } = useCurrentUser();
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-8">
      <div className="flex flex-1 flex-col-reverse gap-8 lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-4">
          <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            {t('hero.eyebrow')}
          </span>
          <h1 className="max-w-140 text-4xl leading-[1.04] font-medium tracking-[-0.02em] sm:text-[46px]">
            {t('hero.titleLead')}{' '}
            <span className="font-serif font-normal text-brand italic">
              {t('hero.titleAccent')}
            </span>
          </h1>
          <p className="max-w-130 font-serif text-lg leading-normal text-muted-foreground">
            {isAuthenticated
              ? t('hero.signedInAs', {
                  email: data?.user.email ?? t('hero.yourAccount'),
                })
              : t('hero.description')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {isAuthenticated ? (
              <Button size="lg" render={<Link to="/home" />}>
                {t('hero.openWorkspace')}
                <ArrowRightIcon aria-hidden="true" />
              </Button>
            ) : (
              <>
                <Button size="lg" render={<Link to="/register" />}>
                  {t('hero.createAccount')}
                  <ArrowRightIcon aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  render={<Link to="/login" />}
                >
                  {t('auth.signIn')}
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="relative min-h-72 min-w-0 overflow-hidden bg-secondary lg:max-w-110 lg:flex-[0_1_440px]">
          <img
            src={heroImage}
            alt={t('hero.imageAlt')}
            className="absolute inset-0 size-full object-cover object-[50%_30%]"
          />
        </div>
      </div>
      <ol
        aria-label={t('hero.stepsLabel')}
        className="grid grid-cols-2 border-t lg:grid-cols-4"
      >
        {STEPS.map((step, index) => (
          <li key={step} className="flex flex-col gap-1 pt-4 pr-4">
            <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-base font-semibold">
              {t(`hero.steps.${step}`)}
            </span>
          </li>
        ))}
      </ol>
    </main>
  );
}
