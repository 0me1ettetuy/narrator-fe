import { Link, useLocation, useRouter } from '@tanstack/react-router';
import { ArrowLeftIcon, HomeIcon, LibraryBigIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { ErrorPageContent } from '@/shared/ui/error-page';

export function NotFoundPage() {
  const router = useRouter();
  const pathname = useLocation({ select: (location) => location.pathname });
  const { accessToken } = useSession();
  const { t } = useTranslation();
  const isAuthenticated = Boolean(accessToken);

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-16 sm:px-8">
      <ErrorPageContent
        eyebrow={t('notFound.eyebrow')}
        title={t('notFound.title')}
        description={
          isAuthenticated
            ? t('notFound.description')
            : t('notFound.descriptionPublic')
        }
        detail={pathname}
        actions={
          isAuthenticated ? (
            <>
              <Button render={<Link to="/library" />}>
                <LibraryBigIcon aria-hidden="true" />
                {t('notFound.goToLibrary')}
              </Button>
              <Button variant="outline" onClick={() => router.history.back()}>
                <ArrowLeftIcon aria-hidden="true" />
                {t('common.goBack')}
              </Button>
            </>
          ) : (
            <>
              <Button render={<Link to="/" />}>
                <HomeIcon aria-hidden="true" />
                {t('notFound.goToHome')}
              </Button>
              <Button variant="outline" render={<Link to="/login" />}>
                {t('auth.signIn')}
              </Button>
            </>
          )
        }
      />
    </main>
  );
}
