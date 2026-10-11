import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authControllerMeOptions, authControllerRefresh } from '@/shared/api';
import { renewCsrfToken, session } from '@/shared/auth';

export function SessionBootstrap({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const hasBootstrapped = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (hasBootstrapped.current) {
      return;
    }

    hasBootstrapped.current = true;

    void (async () => {
      try {
        if (!(await renewCsrfToken())) {
          return;
        }

        const { data: refresh } = await authControllerRefresh();

        if (!refresh) {
          return;
        }

        if (!(await renewCsrfToken())) {
          return;
        }

        session.setAccessToken(refresh.accessToken);

        try {
          await queryClient.fetchQuery({
            ...authControllerMeOptions(),
            retry: false,
          });
        } catch {
          session.clearAccessToken();
        }
      } catch {
        session.clear();
      } finally {
        setIsReady(true);
      }
    })();
  }, [queryClient]);

  return isReady ? children : null;
}
