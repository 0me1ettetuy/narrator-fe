import { useRouter } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { HeaderBreadcrumbs } from './HeaderBreadcrumbs';

export function AuthorizedHeader() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('common.goBack')}
        title={t('common.goBack')}
        onClick={() => router.history.back()}
      >
        <ArrowLeftIcon aria-hidden="true" />
      </Button>
      <span className="h-4 w-px bg-border" aria-hidden="true" />
      <HeaderBreadcrumbs />
    </header>
  );
}
