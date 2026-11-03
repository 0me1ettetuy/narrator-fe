import { useRouter } from '@tanstack/react-router';
import { ArrowLeftIcon, PanelLeftIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { useSidebar } from '@/shared/ui/sidebar';
import { HeaderBreadcrumbs } from './HeaderBreadcrumbs';

export function AuthorizedHeader() {
  const router = useRouter();
  const { t } = useTranslation();
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      {/* Below md the sidebar is a sheet with no visible opener, so the header provides one. */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        aria-label={t('sidebar.toggle')}
        title={t('sidebar.toggle')}
        onClick={toggleSidebar}
      >
        <PanelLeftIcon aria-hidden="true" />
      </Button>
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
