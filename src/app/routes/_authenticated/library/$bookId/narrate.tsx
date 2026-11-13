import { createFileRoute } from '@tanstack/react-router';
import { BookPage } from '@/pages/book';

function NarrateBookRoute() {
  const { bookId } = Route.useParams();

  return <BookPage bookId={bookId} mode="narrate" />;
}

export const Route = createFileRoute('/_authenticated/library/$bookId/narrate')(
  {
    staticData: { breadcrumb: 'navigation.narrate' },
    component: NarrateBookRoute,
  },
);
