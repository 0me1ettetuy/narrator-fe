import { Fragment } from 'react';
import { Link, useMatches } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
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
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isCurrentPage = index === crumbs.length - 1;
          const destination = getBreadcrumbDestination(crumb.label);
          const bookId =
            crumb.label === 'navigation.book' ? crumb.params.bookId : undefined;

          return (
            <Fragment key={crumb.label}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isCurrentPage ? (
                  <BreadcrumbPage>{t(crumb.label)}</BreadcrumbPage>
                ) : bookId ? (
                  <BreadcrumbLink
                    render={<Link to="/library/$bookId" params={{ bookId }} />}
                  >
                    {t(crumb.label)}
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

function getBreadcrumbDestination(label: string) {
  return breadcrumbDestinations[label as keyof typeof breadcrumbDestinations];
}
