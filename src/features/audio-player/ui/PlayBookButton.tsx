import { PauseIcon, PlayIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { usePlayer } from '../model/player-context';
import { loadBookState } from '../model/saved-playback';

// Plays the book, offers to continue when this book has saved progress, and
// pauses it while it plays.
export function PlayBookButton({ bookId }: { bookId: string }) {
  const { t } = useTranslation();
  const player = usePlayer();
  const { data: me } = useCurrentUser();
  const isPlaying = player.activeBookId === bookId && player.view?.isPlaying;
  const canContinue = Boolean(me && loadBookState(me.user.id, bookId));
  const label = isPlaying
    ? t('player.pauseBook')
    : canContinue
      ? t('player.continueBook')
      : t('player.playBook');

  return (
    <Button type="button" size="sm" onClick={() => player.playBook(bookId)}>
      {isPlaying ? (
        <PauseIcon aria-hidden="true" />
      ) : (
        <PlayIcon aria-hidden="true" />
      )}
      {label}
    </Button>
  );
}
