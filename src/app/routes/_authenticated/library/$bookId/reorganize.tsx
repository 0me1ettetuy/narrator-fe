import { createFileRoute } from '@tanstack/react-router';
import { ChapterReorganizePage } from '@/pages/book';

function ReorganizeChaptersRoute() {
  const { bookId } = Route.useParams();

  return <ChapterReorganizePage bookId={bookId} />;
}

export const Route = createFileRoute(
  '/_authenticated/library/$bookId/reorganize',
)({
  staticData: { breadcrumb: 'navigation.reorganize' },
  component: ReorganizeChaptersRoute,
});
