import { z } from 'zod';
import { SPEEDS } from './speeds';

export const bookStateSchema = z.object({
  chapterId: z.string(),
  position: z.number().min(0),
  speed: z
    .number()
    .refine((value) => (SPEEDS as readonly number[]).includes(value)),
});
export type PersistedBook = z.infer<typeof bookStateSchema>;

export const lastBookSchema = z.object({
  bookId: z.string(),
  title: z.string(),
});
export type LastBook = z.infer<typeof lastBookSchema>;

const PREFIX = 'narrator.player';
const bookKey = (userId: string, bookId: string) =>
  `${PREFIX}.v1:${userId}:${bookId}`;
const activeKey = (userId: string) => `${PREFIX}.active:${userId}`;
const lastKey = (userId: string) => `${PREFIX}.last:${userId}`;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full or blocked: playback still works, it just is not remembered.
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to clean up if storage is blocked.
  }
}

function readJson<T>(key: string, schema: z.ZodType<T>): T | null {
  const raw = read(key);
  if (raw === null) return null;

  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export const loadBookState = (userId: string, bookId: string) =>
  readJson(bookKey(userId, bookId), bookStateSchema);
export const saveBookState = (
  userId: string,
  bookId: string,
  state: PersistedBook,
) => write(bookKey(userId, bookId), JSON.stringify(state));
export const clearBookState = (userId: string, bookId: string) =>
  remove(bookKey(userId, bookId));

export const loadActiveBook = (userId: string) => read(activeKey(userId));
export const saveActiveBook = (userId: string, bookId: string) =>
  write(activeKey(userId), bookId);
export const clearActiveBook = (userId: string) => remove(activeKey(userId));

export const loadLastBook = (userId: string) =>
  readJson(lastKey(userId), lastBookSchema);
export const saveLastBook = (userId: string, last: LastBook) =>
  write(lastKey(userId), JSON.stringify(last));
export const clearLastBook = (userId: string) => remove(lastKey(userId));

// Removes every player key of this user, for logout.
export function clearAllPlayerState(userId: string) {
  try {
    const owned = [
      `${PREFIX}.v1:${userId}:`,
      activeKey(userId),
      lastKey(userId),
    ];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && owned.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Storage blocked: nothing was saved either.
  }
}
