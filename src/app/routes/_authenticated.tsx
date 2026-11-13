import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { GenerationItem, useActiveAudio } from '@/features/audio-generation';
import { PlayerItem, PlayerProvider, usePlayer } from '@/features/audio-player';
import { useSession } from '@/shared/auth';
import { ISLAND_PRIORITY } from '@/shared/config';
import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar';
import { AuthorizedHeader } from '@/widgets/authorized-header';
import { AuthorizedSidebar } from '@/widgets/authorized-sidebar';
import { Island, IslandItem, IslandProvider } from '@/widgets/island';

// Joins the player and the island: the player knows nothing about the island
// and the island nothing about the player. The item exists only while a player
// is open, so closing it drops it from the island.
function PlayerDock() {
  const { t } = useTranslation();
  const { view } = usePlayer();

  return view ? (
    <IslandItem
      id="player"
      priority={ISLAND_PRIORITY.player}
      label={t('player.region')}
    >
      <PlayerItem />
    </IslandItem>
  ) : null;
}

// Same idea for audio generation: the item exists only while the user has
// chapters queued or processing, on any page.
function GenerationDock() {
  const { t } = useTranslation();
  const books = useActiveAudio();

  return books.length > 0 ? (
    <IslandItem
      id="generation"
      priority={ISLAND_PRIORITY.generation}
      label={t('generation.region')}
    >
      <GenerationItem books={books} />
    </IslandItem>
  ) : null;
}

function AuthenticatedLayout() {
  const { accessToken } = useSession();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider
      defaultOpen={window.matchMedia('(min-width: 1024px)').matches}
    >
      <IslandProvider>
        <PlayerProvider>
          <AuthorizedSidebar />
          <SidebarInset>
            <AuthorizedHeader />
            <main className="min-h-[calc(100svh-3.5rem)] bg-background text-foreground">
              <Outlet />
              <Island />
              <PlayerDock />
              <GenerationDock />
            </main>
          </SidebarInset>
        </PlayerProvider>
      </IslandProvider>
    </SidebarProvider>
  );
}

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
});
