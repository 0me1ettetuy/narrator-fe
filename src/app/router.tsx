import { RouterProvider, createRouter } from '@tanstack/react-router';
import { RouteErrorPage } from '@/pages/route-error';
import { routeTree } from '@/app/routeTree.gen';

const router = createRouter({
  routeTree,
  defaultErrorComponent: RouteErrorPage,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}
