/* eslint-disable react-hooks/set-state-in-effect -- the player state is synced from storage and server data (external systems) */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetBookOptions,
  booksControllerGetChapterAudioAccessOptions,
  getApiErrorCode,
  getApiErrorTranslationKeyForCode,
} from '@/shared/api';
import { useCurrentUser } from '@/shared/auth';
import { toast } from '@/shared/ui/toast';
import { PlayerContext, type PlayerApi } from './player-context';
import { getNeighbors, getQueue, resolveStart, type QueueEntry } from './queue';
import {
  clearActiveBook,
  clearBookState,
  clearLastBook,
  loadActiveBook,
  loadBookState,
  loadLastBook,
  saveActiveBook,
  saveBookState,
  saveLastBook,
  type PersistedBook,
} from './saved-playback';
import { nextSpeed } from './speeds';

const ACCESS_STALE_TIME = 14 * 60 * 1_000;
const SAVE_EVERY_MS = 5_000;

const accessOptions = (bookId: string, chapterId: string) => ({
  ...booksControllerGetChapterAudioAccessOptions({
    path: { bookId, chapterId },
  }),
  staleTime: ACCESS_STALE_TIME,
});

// Owns the single <audio> element for the whole authenticated app, so
// navigating between pages never interrupts playback. The queue is derived
// live from the active book's chapters that have READY audio.
export function PlayerProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: me } = useCurrentUser();
  const userId = me?.user.id;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Set by play actions, consumed once the source has loaded.
  const autoplayRef = useRef(false);
  const startPositionRef = useRef(0);
  const loadedRef = useRef(false); // false until the start position is applied
  const userStartedRef = useRef(false); // a play action, not a reload restore
  const lastSaveRef = useRef(0);
  const retriedRef = useRef<string | null>(null);
  const prefetchedRef = useRef<string | null>(null);

  const bookQuery = useQuery({
    ...booksControllerGetBookOptions({
      path: { bookId: activeBookId ?? '' },
    }),
    enabled: Boolean(activeBookId),
  });
  const queue = bookQuery.data ? getQueue(bookQuery.data.chapters) : [];
  const current = queue.find((entry) => entry.chapterId === activeChapterId);
  const { previous, next } = activeChapterId
    ? getNeighbors(queue, activeChapterId)
    : { previous: null, next: null };

  const accessQuery = useQuery({
    ...accessOptions(activeBookId ?? '', activeChapterId ?? ''),
    enabled: Boolean(activeBookId && activeChapterId && current),
  });
  const playbackUrl = accessQuery.data?.playbackUrl;

  // The toast action outlives this render, so it calls the latest playBook.
  const apiRef = useRef<PlayerApi | null>(null);

  // Latest values for event handlers and timers.
  const latest = useRef({ userId, activeBookId, activeChapterId, speed, next });
  useEffect(() => {
    latest.current = { userId, activeBookId, activeChapterId, speed, next };
    apiRef.current = playerApi;
  });

  function persist(patch: Partial<PersistedBook> = {}) {
    const s = latest.current;
    if (!s.userId || !s.activeBookId || !s.activeChapterId) return;
    if (!loadedRef.current && patch.position === undefined) return;
    lastSaveRef.current = Date.now();
    saveBookState(s.userId, s.activeBookId, {
      chapterId: s.activeChapterId,
      position: audioRef.current?.currentTime ?? 0,
      speed: s.speed,
      ...patch,
    });
  }

  function loadSource(url: string) {
    const audio = audioRef.current;
    if (!audio || audio.getAttribute('src') === url) return;
    loadedRef.current = false;
    audio.src = url;
    audio.load();
  }

  function goTo(entry: QueueEntry, autoplay: boolean) {
    const s = latest.current;
    audioRef.current?.pause();
    loadedRef.current = false;
    autoplayRef.current = autoplay;
    startPositionRef.current = 0;
    retriedRef.current = null;
    setErrorCode(null);
    setCurrentTime(0);
    setDuration(0);
    setActiveChapterId(entry.chapterId);
    if (s.userId && s.activeBookId) {
      saveBookState(s.userId, s.activeBookId, {
        chapterId: entry.chapterId,
        position: 0,
        speed: s.speed,
      });
    }
  }

  function close() {
    const audio = audioRef.current;
    persist();
    audio?.pause();
    audio?.removeAttribute('src');
    audio?.load();
    loadedRef.current = false;
    if (latest.current.userId) clearActiveBook(latest.current.userId);
    setActiveBookId(null);
    setActiveChapterId(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setErrorCode(null);
  }

  // Reload: restore the open player paused, or offer to continue the last book.
  const initializedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!userId || initializedFor.current === userId) return;
    initializedFor.current = userId;

    const active = loadActiveBook(userId);
    if (active) {
      setActiveBookId(active);
      return;
    }

    const last = loadLastBook(userId);
    if (!last || !loadBookState(userId, last.bookId)) return;
    toast.add({
      id: 'player-resume',
      type: 'info',
      title: t('player.resumeTitle'),
      description: t('player.resumeDescription', { title: last.title }),
      timeout: 15_000,
      actionProps: {
        children: t('player.resumeAction'),
        onClick: () => apiRef.current?.playBook(last.bookId),
      },
    });
  }, [userId, t]);

  // Keep the player in step with the book: pick the start, drop vanished
  // chapters, close when the book is gone or has no audio.
  useEffect(() => {
    if (!userId || !activeBookId) return;

    if (bookQuery.error) {
      const code = getApiErrorCode(bookQuery.error);
      if (code === 'FORBIDDEN' || code === 'NOT_FOUND') {
        clearBookState(userId, activeBookId);
        if (loadLastBook(userId)?.bookId === activeBookId)
          clearLastBook(userId);
        close();
      }
      return;
    }

    const data = bookQuery.data;
    if (!data) return;
    saveLastBook(userId, { bookId: activeBookId, title: data.book.title });

    if (queue.length === 0) {
      if (userStartedRef.current) {
        toast.add({ title: t('player.noAudio'), type: 'info' });
      }
      if (loadLastBook(userId)?.bookId === activeBookId) clearLastBook(userId);
      userStartedRef.current = false;
      close();
      return;
    }

    if (current) return;

    // First load of this book (play or restore), or the chapter lost its audio.
    const saved = activeChapterId ? null : loadBookState(userId, activeBookId);
    const start = resolveStart(queue, saved);
    if (!start) return;
    if (!activeChapterId) {
      autoplayRef.current = userStartedRef.current;
      if (saved) setSpeed(saved.speed);
    } else {
      autoplayRef.current = false;
    }
    userStartedRef.current = false;
    loadedRef.current = false;
    startPositionRef.current = start.position;
    setCurrentTime(start.position);
    setActiveChapterId(start.entry.chapterId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeBookId, bookQuery.data, bookQuery.error]);

  useEffect(() => {
    if (playbackUrl) loadSource(playbackUrl);
  }, [playbackUrl]);

  useEffect(() => {
    const onHide = () => persist();
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, []);

  function handleLoadedMetadata(event: SyntheticEvent<HTMLAudioElement>) {
    const audio = event.currentTarget;
    const start = Math.min(startPositionRef.current, audio.duration || 0);
    if (start > 0) audio.currentTime = start;
    audio.playbackRate = latest.current.speed;
    loadedRef.current = true;
    setDuration(audio.duration);
    setCurrentTime(audio.currentTime);
    if (autoplayRef.current) {
      autoplayRef.current = false;
      // Blocked autoplay just leaves the player paused.
      audio.play().catch(() => undefined);
    }
  }

  function handleTimeUpdate(event: SyntheticEvent<HTMLAudioElement>) {
    const time = event.currentTarget.currentTime;
    setCurrentTime(time);
    if (Date.now() - lastSaveRef.current > SAVE_EVERY_MS) persist();

    const s = latest.current;
    if (
      time > 1 &&
      s.next &&
      s.activeBookId &&
      prefetchedRef.current !== s.activeChapterId
    ) {
      prefetchedRef.current = s.activeChapterId;
      void queryClient.prefetchQuery(
        accessOptions(s.activeBookId, s.next.chapterId),
      );
    }
  }

  function handleEnded() {
    if (latest.current.next) {
      goTo(latest.current.next, true);
      return;
    }
    // Last chapter done: stay open, paused at the start.
    const audio = audioRef.current;
    if (audio) audio.currentTime = 0;
    setCurrentTime(0);
    persist({ position: 0 });
  }

  async function handleError(event: SyntheticEvent<HTMLAudioElement>) {
    const audio = event.currentTarget;
    const s = latest.current;
    if (!audio.getAttribute('src') || !s.activeBookId || !s.activeChapterId)
      return;

    // Likely an expired signed URL: refetch once, resume where it stopped.
    if (retriedRef.current !== s.activeChapterId) {
      retriedRef.current = s.activeChapterId;
      startPositionRef.current = audio.currentTime;
      autoplayRef.current = !audio.paused || isPlaying;
      const result = await accessQuery.refetch();
      if (result.data) loadSource(result.data.playbackUrl);
      return;
    }

    if (s.next) {
      toast.add({
        title: t(getApiErrorTranslationKeyForCode('NETWORK_ERROR')),
        type: 'error',
      });
      goTo(s.next, true);
      return;
    }
    audio.pause();
    setErrorCode('NETWORK_ERROR');
  }

  function playBook(bookId: string) {
    if (latest.current.activeBookId === bookId) {
      toggle();
      return;
    }
    if (!userId) return;
    audioRef.current?.pause();
    persist();
    userStartedRef.current = true;
    loadedRef.current = false;
    retriedRef.current = null;
    prefetchedRef.current = null;
    setErrorCode(null);
    setActiveChapterId(null);
    setActiveBookId(bookId);
    saveActiveBook(userId, bookId);
  }

  function playChapter(bookId: string, chapterId: string) {
    const s = latest.current;
    if (s.activeBookId === bookId && s.activeChapterId === chapterId) {
      toggle();
      return;
    }
    if (!userId) return;
    audioRef.current?.pause();
    persist();
    userStartedRef.current = false;
    autoplayRef.current = true;
    startPositionRef.current = 0;
    loadedRef.current = false;
    retriedRef.current = null;
    prefetchedRef.current = null;
    setErrorCode(null);
    setCurrentTime(0);
    setDuration(0);
    setActiveBookId(bookId);
    setActiveChapterId(chapterId);
    saveActiveBook(userId, bookId);
    saveBookState(userId, bookId, { chapterId, position: 0, speed: s.speed });
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.getAttribute('src')) {
      autoplayRef.current = true; // still loading: start when ready
      return;
    }
    if (audio.paused) audio.play().catch(() => undefined);
    else audio.pause();
  }

  function seek(seconds: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  }

  const playerApi: PlayerApi = {
    activeBookId,
    activeChapterId,
    view:
      bookQuery.data && current
        ? {
            bookTitle: bookQuery.data.book.title,
            hasCover: bookQuery.data.book.hasCover,
            chapter: current,
            isPlaying,
            currentTime,
            duration,
            speed,
            downloadUrl: accessQuery.data?.downloadUrl ?? null,
            errorCode,
            hasPrevious: Boolean(previous),
            hasNext: Boolean(next),
          }
        : null,
    playBook,
    playChapter,
    toggle,
    next: () => next && goTo(next, true),
    previous: () => {
      if (currentTime > 3 || !previous) seek(0);
      else goTo(previous, true);
    },
    seek,
    cycleSpeed: () => {
      const value = nextSpeed(speed);
      setSpeed(value);
      if (audioRef.current) audioRef.current.playbackRate = value;
      persist({ speed: value });
    },
    close,
  };
  return (
    <PlayerContext.Provider value={playerApi}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          setIsPlaying(false);
          persist();
        }}
        onEnded={handleEnded}
        onError={handleError}
      />
    </PlayerContext.Provider>
  );
}
