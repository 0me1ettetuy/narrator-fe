import type { UseQueryResult } from '@tanstack/react-query';
import { InboxIcon, TriangleAlertIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/empty';
import { Spinner } from '@/shared/ui/spinner';

type DataStateProps<TData, TError> = {
  children: (data: TData) => ReactNode;
  empty?: ReactNode;
  error?: (error: TError, retry: () => void) => ReactNode;
  isEmpty: (data: TData) => boolean;
  loading?: ReactNode;
  query: Pick<
    UseQueryResult<TData, TError>,
    'data' | 'error' | 'isError' | 'isPending' | 'refetch'
  >;
};

type EmptyStateProps = {
  action?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  title?: ReactNode;
};

type ErrorStateProps = {
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: ReactNode;
  title?: ReactNode;
};

type LoadingStateProps = {
  label?: ReactNode;
};

function LoadingState({ label }: LoadingStateProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground"
      role="status"
    >
      <Spinner aria-hidden="true" />
      <span>{label ?? t('states.loading')}</span>
    </div>
  );
}

function EmptyState({ action, description, icon, title }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon ?? <InboxIcon />}</EmptyMedia>
        <EmptyTitle>{title ?? t('states.emptyTitle')}</EmptyTitle>
        <EmptyDescription>
          {description ?? t('states.emptyDescription')}
        </EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}

function ErrorState({
  description,
  onRetry,
  retryLabel,
  title,
}: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <Alert variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>{title ?? t('states.errorTitle')}</AlertTitle>
      <AlertDescription>
        {description ?? t('states.errorDescription')}
      </AlertDescription>
      {onRetry && (
        <div className="mt-2">
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryLabel ?? t('common.retry')}
          </Button>
        </div>
      )}
    </Alert>
  );
}

function DataState<TData, TError>({
  children,
  empty,
  error,
  isEmpty,
  loading,
  query,
}: DataStateProps<TData, TError>) {
  if (query.isPending) {
    return loading ?? <LoadingState />;
  }

  const retry = () => {
    void query.refetch();
  };

  if (query.isError) {
    if (error && query.error !== null) {
      return error(query.error, retry);
    }

    return <ErrorState onRetry={retry} />;
  }

  if (query.data === undefined) {
    return <ErrorState onRetry={retry} />;
  }

  if (isEmpty(query.data)) {
    return empty ?? <EmptyState />;
  }

  return children(query.data);
}

export { DataState, EmptyState, ErrorState, LoadingState };
