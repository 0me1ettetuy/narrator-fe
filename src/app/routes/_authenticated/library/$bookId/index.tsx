import { createFileRoute } from '@tanstack/react-router';
import { BookPage } from '@/pages/book';

function BookRoute() {
  const { bookId } = Route.useParams();

  return <BookPage bookId={bookId} />;
}

export const Route = createFileRoute('/_authenticated/library/$bookId/')({
  component: BookRoute,
});
