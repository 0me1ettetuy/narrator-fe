import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { Home, PanelLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getApiErrorTranslationKey } from '@/shared/api';
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
import { toast } from '@/shared/ui/toast';
import { SidebarSettings } from './SidebarSettings';
import { UserCard } from './UserCard';

function SidebarToggleButton() {
  const { toggleSidebar } = useSidebar();
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      aria-label={t('sidebar.toggle')}
      title={t('sidebar.toggle')}
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
  const { t } = useTranslation();

  async function handleLogout() {
    try {
      await logout.mutateAsync({});
      toast.add({ title: t('notifications.signedOut'), type: 'success' });
      await navigate({ to: '/login' });
    } catch (error) {
      toast.add({
        title: t('notifications.signOutFailed'),
        description: t(getApiErrorTranslationKey(error)),
        type: 'error',
        priority: 'high',
      });
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
              <SidebarMenuButton
                render={<Link to="/home" />}
                tooltip={t('navigation.home')}
              >
                <Home />
                <span>{t('navigation.home')}</span>
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
