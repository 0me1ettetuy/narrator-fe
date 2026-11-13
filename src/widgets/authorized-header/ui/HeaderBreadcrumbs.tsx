import { useQuery } from '@tanstack/react-query';
import { Fragment } from 'react';
import { Link, useMatches } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { booksControllerGetBookOptions } from '@/shared/api';
import { cn } from '@/shared/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb';

type BreadcrumbStaticData = {
  breadcrumb?: string;
};

const breadcrumbDestinations = {
  'navigation.home': '/home',
  'navigation.library': '/library',
  'navigation.models': '/models',
} as const;

export function HeaderBreadcrumbs() {
  const { t } = useTranslation();
  const crumbs = useMatches({
    select: (matches) =>
      matches.flatMap((match) => {
        const { breadcrumb: label } = match.staticData as BreadcrumbStaticData;
        return label
          ? [{ label, params: match.params as { bookId?: string } }]
          : [];
      }),
  });

  return (
    <Breadcrumb className="min-w-0">
      {/* One line in the fixed-height header; below sm only the current page shows. */}
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const isCurrentPage = index === crumbs.length - 1;
          const destination = getBreadcrumbDestination(crumb.label);
          const bookId =
            crumb.label === 'navigation.book' ? crumb.params.bookId : undefined;

          return (
            <Fragment key={crumb.label}>
              {index > 0 && <BreadcrumbSeparator className="max-sm:hidden" />}
              <BreadcrumbItem
                className={cn('min-w-0', !isCurrentPage && 'max-sm:hidden')}
              >
                {isCurrentPage ? (
                  <BreadcrumbPage>
                    {bookId ? <BookTitle bookId={bookId} /> : t(crumb.label)}
                  </BreadcrumbPage>
                ) : bookId ? (
                  <BreadcrumbLink
                    render={<Link to="/library/$bookId" params={{ bookId }} />}
                  >
                    <BookTitle bookId={bookId} />
                  </BreadcrumbLink>
                ) : destination ? (
                  <BreadcrumbLink render={<Link to={destination} />}>
                    {t(crumb.label)}
                  </BreadcrumbLink>
                ) : (
                  <span>{t(crumb.label)}</span>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// The book's own title instead of the word "Book"; it shares the book page's
// cached query, and the generic label shows until it loads.
function BookTitle({ bookId }: { bookId: string }) {
  const { t } = useTranslation();
  const { data } = useQuery({
    ...booksControllerGetBookOptions({ path: { bookId } }),
    select: (book) => book.book.title,
  });

  return (
    <span className="block max-w-40 truncate sm:max-w-64" title={data}>
      {data ?? t('navigation.book')}
    </span>
  );
}

function getBreadcrumbDestination(label: string) {
  return breadcrumbDestinations[label as keyof typeof breadcrumbDestinations];
}
