import { useQuery } from '@tanstack/react-query';
import { authControllerMeOptions } from '@/shared/api';
import { useSession } from './session';

export function useCurrentUser() {
  const { accessToken } = useSession();
  const isAuthenticated = Boolean(accessToken);
  const query = useQuery({
    ...authControllerMeOptions(),
    enabled: isAuthenticated,
    retry: false,
  });

  return {
    data: query.data,
    isAuthenticated,
  };
}
