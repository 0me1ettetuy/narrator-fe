import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/app/styles/index.css';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from '@/app/routeTree.gen';
import { Providers } from '@/app/providers';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
