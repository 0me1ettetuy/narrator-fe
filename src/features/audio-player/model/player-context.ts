import { createContext, useContext } from 'react';
import type { QueueEntry } from './queue';

export type PlayerView = {
  bookTitle: string;
  hasCover: boolean;
  chapter: QueueEntry;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  downloadUrl: string | null;
  errorCode: string | null;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type PlayerApi = {
  activeBookId: string | null;
  activeChapterId: string | null;
  /** Null while no player is open or its book has not loaded yet. */
  view: PlayerView | null;
  playBook: (bookId: string) => void;
  playChapter: (bookId: string, chapterId: string) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  cycleSpeed: () => void;
  close: () => void;
};

export const PlayerContext = createContext<PlayerApi | null>(null);

export function usePlayer() {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error('usePlayer must be used inside PlayerProvider');
  }

  return context;
}
