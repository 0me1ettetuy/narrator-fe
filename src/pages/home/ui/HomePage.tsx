import { useTranslation } from 'react-i18next';

export function HomePage() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <p className="text-sm font-medium text-muted-foreground">Narrator</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {t('home.title')}
      </h1>
      <p className="mt-3 text-muted-foreground">{t('home.description')}</p>
    </section>
  );
}
