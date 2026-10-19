import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/library')({
  staticData: { breadcrumb: 'navigation.library' },
  component: Outlet,
});
