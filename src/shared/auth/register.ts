import type { QueryClient } from '@tanstack/react-query';
import {
  authControllerMeQueryKey,
  authControllerRegisterMutation,
  type AuthControllerRegisterResponse,
} from '@/shared/api';
import { renewCsrfToken } from './csrf';
import { session } from './session';

export function registerMutationOptions(queryClient: QueryClient) {
  return {
    ...authControllerRegisterMutation(),
    onSuccess: async ({ accessToken }: AuthControllerRegisterResponse) => {
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
