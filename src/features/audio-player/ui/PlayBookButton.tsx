import { PauseIcon, PlayIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { usePlayer } from '../model/player-context';

// Starts the book where the listener left off, or pauses it while it plays.
export function PlayBookButton({ bookId }: { bookId: string }) {
  const { t } = useTranslation();
  const player = usePlayer();
  const isPlaying = player.activeBookId === bookId && player.view?.isPlaying;

  return (
    <Button type="button" size="sm" onClick={() => player.playBook(bookId)}>
      {isPlaying ? (
        <PauseIcon aria-hidden="true" />
      ) : (
        <PlayIcon aria-hidden="true" />
      )}
      {isPlaying ? t('player.pauseBook') : t('player.playBook')}
    </Button>
  );
}
