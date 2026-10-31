import type { UseQueryResult } from '@tanstack/react-query';
import { InboxIcon, RotateCcwIcon, TriangleAlertIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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
    <Empty
      role="alert"
      className="min-h-60 border-solid bg-card px-6 py-10 shadow-sm"
    >
      <EmptyHeader className="gap-3">
        <EmptyMedia
          variant="icon"
          className="size-11 rounded-full bg-destructive/10 text-destructive [&_svg:not([class*='size-'])]:size-5"
        >
          <TriangleAlertIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle className="text-base">
          {title ?? t('states.errorTitle')}
        </EmptyTitle>
        <EmptyDescription>
          {description ?? t('states.errorDescription')}
        </EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent className="mt-1">
          <Button onClick={onRetry}>
            <RotateCcwIcon aria-hidden="true" />
            {retryLabel ?? t('common.retry')}
          </Button>
        </EmptyContent>
      )}
    </Empty>
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
