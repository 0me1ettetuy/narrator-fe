import type { ChapterSummaryResponseDto } from '@/shared/api';
import type { PersistedBook } from './saved-playback';

export type QueueEntry = { chapterId: string; position: number; title: string };

export function getQueue(chapters: ChapterSummaryResponseDto[]): QueueEntry[] {
  return chapters
    .filter((chapter) => chapter.audio?.status === 'READY')
    .sort((a, b) => a.position - b.position)
    .map(({ id, position, title }) => ({ chapterId: id, position, title }));
}

export function getNeighbors(queue: QueueEntry[], chapterId: string) {
  const index = queue.findIndex((entry) => entry.chapterId === chapterId);

  return {
    previous: index > 0 ? queue[index - 1] : null,
    next: index !== -1 && index < queue.length - 1 ? queue[index + 1] : null,
  };
}

// Saved chapter and position if the chapter still has audio, else the first.
export function resolveStart(
  queue: QueueEntry[],
  saved: PersistedBook | null,
): { entry: QueueEntry; position: number } | null {
  const savedEntry = saved
    ? queue.find((entry) => entry.chapterId === saved.chapterId)
    : undefined;

  if (savedEntry && saved)
    return { entry: savedEntry, position: saved.position };

  return queue.length > 0 ? { entry: queue[0], position: 0 } : null;
}
