import type { QueryClient } from '@tanstack/react-query';
import {
  authControllerMeQueryKey,
  authControllerRegisterMutation,
  type AuthControllerRegisterResponse,
} from '@/shared/api';
import { session } from './session';

export function registerMutationOptions(queryClient: QueryClient) {
  return {
    ...authControllerRegisterMutation(),
    onSuccess: ({ accessToken }: AuthControllerRegisterResponse) => {
      session.setAccessToken(accessToken);
      void queryClient.invalidateQueries({
        queryKey: authControllerMeQueryKey(),
      });
    },
  };
}
