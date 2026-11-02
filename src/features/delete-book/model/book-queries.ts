import type { QueryKey } from '@tanstack/react-query';

// Generated query keys carry their path params, e.g. [{ _id, path: { bookId } }].
export function isBookScopedQuery(queryKey: QueryKey, bookId: string): boolean {
  const [key] = queryKey;

  return (
    typeof key === 'object' &&
    key !== null &&
    'path' in key &&
    typeof key.path === 'object' &&
    key.path !== null &&
    'bookId' in key.path &&
    key.path.bookId === bookId
  );
}
