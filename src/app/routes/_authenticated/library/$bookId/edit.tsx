import { createFileRoute } from '@tanstack/react-router';
import { BookPage } from '@/pages/book';

function EditBookRoute() {
  const { bookId } = Route.useParams();

  return <BookPage bookId={bookId} mode="edit" />;
}

export const Route = createFileRoute('/_authenticated/library/$bookId/edit')({
  staticData: { breadcrumb: 'navigation.edit' },
  component: EditBookRoute,
});
