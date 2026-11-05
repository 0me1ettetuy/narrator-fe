import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BookmarkXIcon, BookmarkPlusIcon, LibraryBigIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetBookCoverAccessOptions,
  collectionsControllerAddToLibraryMutation,
  collectionsControllerListCollectionsQueryKey,
  collectionsControllerListPublicCollectionsQueryKey,
  collectionsControllerRemoveFromLibraryMutation,
  type CollectionSummaryResponseDto,
} from '@/shared/api';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

type CollectionCardProps = {
  collection: CollectionSummaryResponseDto;
};

export function CollectionCard({ collection }: CollectionCardProps) {
  const { t } = useTranslation();
  const coverQuery = useQuery({
    ...booksControllerGetBookCoverAccessOptions({
      path: { bookId: collection.coverBookId ?? '' },
    }),
    enabled: collection.coverBookId !== null,
    staleTime: 14 * 60 * 1_000,
  });

  return (
    <div className="relative flex h-full flex-col">
      <Link
        to="/library/collections/$collectionId"
        params={{ collectionId: collection.id }}
        aria-label={t('collection.open', { title: collection.title })}
        className="group block flex-1 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Card className="h-full gap-0 py-0">
          {coverQuery.data ? (
            <img
              src={coverQuery.data.coverUrl}
              alt=""
              className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div
              className="flex aspect-[16/9] items-center justify-center bg-muted text-muted-foreground"
              aria-hidden="true"
            >
              <LibraryBigIcon className="size-8" />
            </div>
          )}
          <CardHeader className="pt-4">
            <CardTitle className="truncate" title={collection.title}>
              {collection.title}
            </CardTitle>
            {collection.description && (
              <CardDescription className="line-clamp-2">
                {collection.description}
              </CardDescription>
            )}
            <CardAction>
              <Badge
                variant={
                  collection.visibility === 'PUBLIC' ? 'secondary' : 'outline'
                }
              >
                {collection.visibility === 'PUBLIC'
                  ? t('book.publicBadge')
                  : t('collection.privateBadge')}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex-1 pb-4" />
          <CardFooter className="px-4 py-3 text-muted-foreground">
            {t('library.bookCount', { count: collection.bookCount })}
          </CardFooter>
        </Card>
      </Link>
      {!collection.isOwner && <SaveCollectionToggle collection={collection} />}
    </div>
  );
}

function SaveCollectionToggle({
  collection,
}: {
  collection: CollectionSummaryResponseDto;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: collectionsControllerListCollectionsQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: collectionsControllerListPublicCollectionsQueryKey(),
      }),
    ]);
  };
  const save = useMutation({
    ...collectionsControllerAddToLibraryMutation(),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    ...collectionsControllerRemoveFromLibraryMutation(),
    onSuccess: invalidate,
  });
  const isPending = save.isPending || remove.isPending;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="mt-2 self-start"
      disabled={isPending}
      onClick={() =>
        collection.isAdded
          ? remove.mutate({ path: { collectionId: collection.id } })
          : save.mutate({ path: { collectionId: collection.id } })
      }
    >
      {collection.isAdded ? (
        <BookmarkXIcon aria-hidden="true" />
      ) : (
        <BookmarkPlusIcon aria-hidden="true" />
      )}
      {collection.isAdded
        ? t('collection.removeFromLibrary')
        : t('collection.saveToLibrary')}
    </Button>
  );
}
