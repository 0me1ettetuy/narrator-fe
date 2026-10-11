import { Fragment } from 'react';
import { Link, useMatches } from '@tanstack/react-router';
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

export function HeaderBreadcrumbs() {
  const crumbs = useMatches({
    select: (matches) =>
      matches.flatMap((match) => {
        const { breadcrumb: label } = match.staticData as BreadcrumbStaticData;
        return label ? [{ label, to: match.fullPath }] : [];
      }),
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isCurrentPage = index === crumbs.length - 1;

          return (
            <Fragment key={crumb.to}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isCurrentPage ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link to={crumb.to} />}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
