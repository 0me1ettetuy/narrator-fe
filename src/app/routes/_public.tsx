import { createFileRoute, Outlet } from '@tanstack/react-router';
import { PublicHeader } from '@/widgets/public-header';

function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <PublicHeader />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
});
