import type { QueryClient } from '@tanstack/react-query';
import {
  authControllerLoginMutation,
  authControllerMeQueryKey,
  type AuthControllerLoginResponse,
} from '@/shared/api';
import { renewCsrfToken } from './csrf';
import { session } from './session';

export function loginMutationOptions(queryClient: QueryClient) {
  return {
    ...authControllerLoginMutation(),
    onSuccess: async ({ accessToken }: AuthControllerLoginResponse) => {
      if (!(await renewCsrfToken())) {
        session.clear();
        return;
      }

      session.setAccessToken(accessToken);
      void queryClient.invalidateQueries({
        queryKey: authControllerMeQueryKey(),
      });
    },
  };
}
