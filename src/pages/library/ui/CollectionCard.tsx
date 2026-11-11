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
import { Button } from '@/shared/ui/button';

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
    <div className="flex min-w-0 flex-col gap-2">
      {/* Two sheets peek out behind the cover: a stack of books, not one book. */}
      <div className="relative aspect-[3/4]">
        <span
          className="absolute top-0 right-0 bottom-3 left-3 border bg-muted"
          aria-hidden="true"
        />
        <span
          className="absolute top-1.5 right-1.5 bottom-1.5 left-1.5 border bg-secondary"
          aria-hidden="true"
        />
        <Link
          to="/library/collections/$collectionId"
          params={{ collectionId: collection.id }}
          aria-label={t('collection.open', { title: collection.title })}
          title={collection.title}
          className="group noise absolute top-3 right-3 bottom-0 left-0 flex flex-col overflow-hidden bg-foreground text-background"
        >
          <div className="aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted text-muted-foreground">
            {coverQuery.data ? (
              <img
                src={coverQuery.data.coverUrl}
                alt=""
                className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.01]"
                loading="lazy"
              />
            ) : (
              <div
                className="flex size-full items-center justify-center"
                aria-hidden="true"
              >
                <LibraryBigIcon className="size-8" />
              </div>
            )}
          </div>
          <span className="flex min-h-0 flex-1 flex-col justify-end gap-1.5 px-3.5 pt-3 pb-3.5">
            <span className="truncate text-[9px] font-semibold tracking-[0.08em] uppercase">
              {t('collection.kind')} ·{' '}
              {t('library.bookCount', { count: collection.bookCount })}
            </span>
            <span className="font-serif text-lg leading-[1.12]">
              {collection.title}
            </span>
          </span>
          <span className="absolute top-2 right-2 z-10 inline-flex h-5 items-center bg-card px-1.5 text-[10px] font-semibold tracking-[0.06em] text-foreground uppercase">
            {collection.visibility === 'PUBLIC'
              ? t('book.publicBadge')
              : t('collection.privateBadge')}
          </span>
        </Link>
      </div>
      {collection.description && (
        <p className="line-clamp-2 min-h-8 text-[13px] text-muted-foreground">
          {collection.description}
        </p>
      )}
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
      className="self-start"
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
