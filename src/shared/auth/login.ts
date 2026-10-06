import type { QueryClient } from '@tanstack/react-query';
import {
  authControllerLoginMutation,
  authControllerMeQueryKey,
  type AuthControllerLoginResponse,
} from '@/shared/api';
import { session } from './session';

export function loginMutationOptions(queryClient: QueryClient) {
  return {
    ...authControllerLoginMutation(),
    onSuccess: ({ accessToken }: AuthControllerLoginResponse) => {
      session.setAccessToken(accessToken);
      void queryClient.invalidateQueries({
        queryKey: authControllerMeQueryKey(),
      });
    },
  };
}
