import { useQuery } from '@tanstack/react-query';
import { booksControllerListActiveAudioOptions } from '@/shared/api';

// The user's own books with audio queued or processing. Polls only while
// something is running; whoever queues audio invalidates this query to wake it.
export function useActiveAudio() {
  const query = useQuery({
    ...booksControllerListActiveAudioOptions(),
    refetchInterval: (state) =>
      state.state.data?.books.length ? 2_000 : false,
  });

  return query.data?.books ?? [];
}
