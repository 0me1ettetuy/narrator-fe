import { createFileRoute } from '@tanstack/react-router';
import { CollectionPage } from '@/pages/collection';

function CollectionRoute() {
  const { collectionId } = Route.useParams();

  return <CollectionPage collectionId={collectionId} />;
}

export const Route = createFileRoute(
  '/_authenticated/library/collections/$collectionId',
)({
  staticData: { breadcrumb: 'navigation.collection' },
  component: CollectionRoute,
});
