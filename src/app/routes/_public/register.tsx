import { createFileRoute, Navigate } from '@tanstack/react-router';
import { RegisterPage } from '@/pages/register';
import { useSession } from '@/shared/auth';

export const Route = createFileRoute('/_public/register')({
  component: RegisterRoute,
});

function RegisterRoute() {
  const { accessToken } = useSession();
  return accessToken ? <Navigate to="/home" replace /> : <RegisterPage />;
}
