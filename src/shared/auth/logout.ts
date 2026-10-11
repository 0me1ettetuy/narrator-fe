import type { QueryClient } from '@tanstack/react-query';
import {
  authControllerLogoutMutation,
  authControllerMeQueryKey,
} from '@/shared/api';
import { renewCsrfToken } from './csrf';
import { session } from './session';

export function logoutMutationOptions(queryClient: QueryClient) {
  return {
    ...authControllerLogoutMutation(),
    onSuccess: async () => {
      session.clear();
      await renewCsrfToken();
      queryClient.removeQueries({
        queryKey: authControllerMeQueryKey(),
      });
    },
  };
}
