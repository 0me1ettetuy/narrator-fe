import { useEffect, useRef, type PropsWithChildren } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  authControllerCsrf,
  authControllerMeOptions,
  authControllerRefresh,
} from '@/shared/api';
import { session } from '@/shared/auth';

export function SessionBootstrap({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (hasBootstrapped.current) {
      return;
    }

    hasBootstrapped.current = true;

    void (async () => {
      const { data: csrf } = await authControllerCsrf();

      if (!csrf) {
        return;
      }

      session.setCsrfToken(csrf.csrfToken);

      const { data: refresh } = await authControllerRefresh();

      if (!refresh) {
        return;
      }

      session.setAccessToken(refresh.accessToken);

      try {
        await queryClient.fetchQuery(authControllerMeOptions());
      } catch {
        session.clearAccessToken();
      }
    })();
  }, [queryClient]);

  return children;
}
