import { type ErrorComponentProps, useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '@/shared/ui/data-state';

export function RouteErrorPage({ reset }: ErrorComponentProps) {
  const router = useRouter();
  const { t } = useTranslation();

  function retry() {
    reset();
    void router.invalidate();
  }

  return (
    <section className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <ErrorState
          title={t('states.routeErrorTitle')}
          description={t('states.routeErrorDescription')}
          onRetry={retry}
        />
      </div>
    </section>
  );
}
