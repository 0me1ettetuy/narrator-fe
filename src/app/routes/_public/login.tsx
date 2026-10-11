import { createFileRoute, Navigate } from '@tanstack/react-router';
import { LoginPage } from '@/pages/login';
import { useSession } from '@/shared/auth';

export const Route = createFileRoute('/_public/login')({
  component: LoginRoute,
});

function LoginRoute() {
  const { accessToken } = useSession();
  return accessToken ? <Navigate to="/home" replace /> : <LoginPage />;
}
