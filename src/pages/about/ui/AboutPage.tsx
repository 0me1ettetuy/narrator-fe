import { useTranslation } from 'react-i18next';

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-5xl items-center px-4 py-16">
      <section className="max-w-2xl space-y-6">
        <p className="text-sm font-medium text-muted-foreground">
          {t('about.eyebrow')}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {t('about.title')}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          {t('about.description')}
        </p>
      </section>
    </main>
  );
}
