import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { AudioLines, Home, LibraryBig, PanelLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorTranslationKey } from '@/shared/api';
import { logoutMutationOptions, useCurrentUser } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { LogoMark } from '@/shared/ui/logo';
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

// The raven sits where the toggle is; hovering or focusing the header swaps it
// for the toggle (always the toggle where there is no hover, e.g. touch).
function SidebarToggleButton() {
  const { toggleSidebar } = useSidebar();
  const { t } = useTranslation();

  return (
    <div className="relative size-10 shrink-0">
      <LogoMark className="pointer-events-none absolute h-[22px] w-[26px] inset-0 m-auto transition-opacity group-has-[:focus-visible]/header:opacity-0 group-hover/header:opacity-0 [@media(hover:none)]:hidden" />
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label={t('sidebar.toggle')}
        title={t('sidebar.toggle')}
        className="transition-opacity group-has-[:focus-visible]/header:opacity-100 group-hover/header:opacity-100 [@media(hover:hover)]:opacity-0"
      >
        <PanelLeft />
      </Button>
    </div>
  );
}

export function AuthorizedSidebar() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data } = useCurrentUser();
  const logout = useMutation(logoutMutationOptions(queryClient));
  const { t } = useTranslation();
  const { setOpenMobile } = useSidebar();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

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
      <SidebarHeader className="group/header flex h-14 flex-row items-center gap-0 border-b px-2">
        <SidebarToggleButton />
        <span className="font-serif text-xl font-medium tracking-[-0.01em] group-data-[collapsible=icon]:hidden">
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
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link to="/library" />}
                tooltip={t('navigation.library')}
              >
                <LibraryBig />
                <span>{t('navigation.library')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link to="/models" />}
                tooltip={t('navigation.models')}
              >
                <AudioLines />
                <span>{t('navigation.models')}</span>
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
