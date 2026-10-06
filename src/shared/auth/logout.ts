import type { QueryClient } from '@tanstack/react-query';
import {
  authControllerLogoutMutation,
  authControllerMeQueryKey,
} from '@/shared/api';
import { session } from './session';

export function logoutMutationOptions(queryClient: QueryClient) {
  return {
    ...authControllerLogoutMutation(),
    onSuccess: () => {
      session.clearAccessToken();
      queryClient.removeQueries({
        queryKey: authControllerMeQueryKey(),
      });
    },
  };
}
