import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useSession } from '@/shared/auth';

export const Route = createFileRoute('/')({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { accessToken } = useSession();
  return <Navigate to={accessToken ? '/home' : '/hero'} replace />;
}
