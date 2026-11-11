import { Link } from '@tanstack/react-router';
import {
  ArrowRightIcon,
  AudioLinesIcon,
  Share2Icon,
  UploadIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import aboutImage from '../assets/about.jpg';

const POINTS = [
  { key: 'upload', icon: UploadIcon },
  { key: 'generate', icon: AudioLinesIcon },
  { key: 'share', icon: Share2Icon },
] as const;

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-8">
      <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col justify-end gap-4">
          <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            {t('about.eyebrow')}
          </span>
          <h1 className="text-4xl leading-[1.04] font-medium tracking-[-0.02em] sm:text-[46px]">
            {t('about.titleLead')}{' '}
            <span className="font-serif font-normal italic">
              {t('about.titleAccent')}
            </span>{' '}
            {t('about.titleTail')}
          </h1>
          <p className="max-w-150 font-serif text-lg leading-normal text-muted-foreground">
            {t('about.description')}
          </p>
        </div>
        <div className="relative min-h-75 min-w-0 overflow-hidden bg-secondary lg:max-w-105 lg:flex-[0_1_420px]">
          <img
            src={aboutImage}
            alt={t('about.imageAlt')}
            className="absolute inset-0 size-full object-cover"
          />
        </div>
      </div>
      <div className="grid border-t sm:grid-cols-3">
        {POINTS.map(({ key, icon: Icon }) => (
          <section key={key} className="flex flex-col gap-2 pt-4 pr-4">
            <Icon className="text-brand" aria-hidden="true" />
            <h2 className="text-base font-semibold">
              {t(`about.points.${key}.title`)}
            </h2>
            <p className="font-serif text-sm leading-[1.55] text-muted-foreground">
              {t(`about.points.${key}.description`)}
            </p>
          </section>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button size="lg" render={<Link to="/register" />}>
          {t('hero.createAccount')}
          <ArrowRightIcon aria-hidden="true" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {t('about.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-foreground">
            {t('auth.signIn')}
          </Link>
        </span>
      </div>
    </main>
  );
}
