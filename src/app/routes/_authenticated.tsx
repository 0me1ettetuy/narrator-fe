import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';
import { useSession } from '@/shared/auth';
import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar';
import { AuthorizedHeader } from '@/widgets/authorized-header';
import { AuthorizedSidebar } from '@/widgets/authorized-sidebar';
import { Island, IslandProvider } from '@/widgets/island';

function AuthenticatedLayout() {
  const { accessToken } = useSession();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <IslandProvider>
        <AuthorizedSidebar />
        <SidebarInset>
          <AuthorizedHeader />
          <main className="min-h-[calc(100svh-3.5rem)] bg-background text-foreground">
            <Outlet />
            <Island />
          </main>
        </SidebarInset>
      </IslandProvider>
    </SidebarProvider>
  );
}

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
});
