import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/library/$bookId')({
  staticData: { breadcrumb: 'navigation.book' },
  component: Outlet,
});
