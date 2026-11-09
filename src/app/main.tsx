import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/app/styles/index.css';
import '@/shared/api';
import { Providers } from '@/app/providers';
import { AppRouter } from '@/app/router';
import { initScrollIndicator } from '@/shared/lib/scroll-indicator';

initScrollIndicator();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <AppRouter />
    </Providers>
  </StrictMode>,
);
