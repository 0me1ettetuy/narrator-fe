import {
  type ErrorComponentProps,
  Link,
  useLocation,
  useRouter,
} from '@tanstack/react-router';
import {
  ChevronDownIcon,
  CopyIcon,
  HomeIcon,
  RotateCcwIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getApiErrorCode, getApiErrorTranslationKey } from '@/shared/api';
import { useSession } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';
import { ErrorPageContent } from '@/shared/ui/error-page';

export function RouteErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const pathname = useLocation({ select: (location) => location.pathname });
  const { accessToken } = useSession();
  const { t } = useTranslation();

  // Only the localized, normalized error code is shown, never the raw message.
  const details = [
    t(getApiErrorTranslationKey(error)),
    `${t('routeError.code')}: ${getApiErrorCode(error)}`,
    `${t('routeError.route')}: ${pathname}`,
  ].join('\n');

  function retry() {
    reset();
    void router.invalidate();
  }

  return (
    <section className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-4 py-16 sm:px-8">
      <ErrorPageContent
        eyebrow={t('routeError.eyebrow')}
        title={t('routeError.title')}
        description={t('routeError.description')}
        actions={
          <>
            <Button onClick={retry}>
              <RotateCcwIcon aria-hidden="true" />
              {t('routeError.tryAgain')}
            </Button>
            <Button
              variant="outline"
              render={<Link to={accessToken ? '/home' : '/'} />}
            >
              <HomeIcon aria-hidden="true" />
              {t('notFound.goToHome')}
            </Button>
          </>
        }
      >
        <Collapsible className="border border-border bg-card">
          <CollapsibleTrigger className="group/details flex h-11 w-full items-center gap-2 px-4 text-sm font-medium">
            <ChevronDownIcon
              aria-hidden="true"
              className="size-4 transition-transform group-aria-expanded/details:rotate-180"
            />
            {t('routeError.details')}
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-3 px-4 pb-4">
            <pre className="border border-border bg-background p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {details}
            </pre>
            <div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void navigator.clipboard.writeText(details)}
              >
                <CopyIcon aria-hidden="true" />
                {t('routeError.copyDetails')}
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </ErrorPageContent>
    </section>
  );
}
