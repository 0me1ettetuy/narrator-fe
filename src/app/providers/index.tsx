import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { ThemeProvider } from '@/shared/theme';
import { Toaster } from '@/shared/ui/toast';
import { SessionBootstrap } from './SessionBootstrap';
import { I18nProvider } from './I18nProvider';

const queryClient = new QueryClient();

export function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster>
            <SessionBootstrap>{children}</SessionBootstrap>
          </Toaster>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
