import { createRootRoute, Outlet } from '@tanstack/react-router';
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { NotFoundPage } from '@/pages/not-found';

const RootLayout = () => (
  <>
    <Outlet />
    {/*<TanStackRouterDevtools />*/}
  </>
);

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});
