import { useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';

export function NotFoundPage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <section className="max-w-sm text-center">
        <p className="text-sm font-medium text-muted-foreground">Error 404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t('notFound.title')}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {t('notFound.description')}
        </p>
        <Button className="mt-6" onClick={() => router.history.back()}>
          {t('common.goBack')}
        </Button>
      </section>
    </main>
  );
}
