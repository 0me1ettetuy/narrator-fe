import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { Home, PanelLeft } from 'lucide-react';
import { logoutMutationOptions, useCurrentUser } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shared/ui/sidebar';
import { SidebarSettings } from './SidebarSettings';
import { UserCard } from './UserCard';

function SidebarToggleButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
      title="Toggle sidebar"
    >
      <PanelLeft />
    </Button>
  );
}

export function AuthorizedSidebar() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data } = useCurrentUser();
  const logout = useMutation(logoutMutationOptions(queryClient));

  async function handleLogout() {
    try {
      await logout.mutateAsync({});
      await navigate({ to: '/login' });
    } catch {
      // Keep the current session visible when the server could not end it.
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-14 flex-row items-center gap-0 border-b px-2">
        <SidebarToggleButton />
        <span className="font-semibold group-data-[collapsible=icon]:hidden">
          Narrator
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link to="/home" />} tooltip="Home">
                <Home />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserCard
          email={data?.user.email}
          isLoggingOut={logout.isPending}
          onLogout={handleLogout}
        />
        <SidebarSettings />
      </SidebarFooter>
    </Sidebar>
  );
}
