import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  BookOpenIcon,
  GripVerticalIcon,
  LockIcon,
  Trash2Icon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  collectionsControllerGetCollectionQueryKey,
  collectionsControllerListCollectionsQueryKey,
  collectionsControllerRemoveBookMutation,
  type CollectionBookEntryResponseDto,
  type CollectionSummaryResponseDto,
} from '@/shared/api';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { Card, CardContent } from '@/shared/ui/card';

type CollectionBookRowProps = {
  index: number;
  entry: CollectionBookEntryResponseDto;
  collection: CollectionSummaryResponseDto;
};

export function CollectionBookRow({
  index,
  entry,
  collection,
}: CollectionBookRowProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.bookId, disabled: !collection.isOwner });
  const queryClient = useQueryClient();
  const removeBook = useMutation({
    ...collectionsControllerRemoveBookMutation(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: collectionsControllerGetCollectionQueryKey({
            path: { collectionId: collection.id },
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: collectionsControllerListCollectionsQueryKey(),
        }),
      ]);
    },
  });

  const book = entry.book;
  const authorNames = book?.authors.map((author) => author.name).join(', ');
  const isHiddenFromOthers =
    collection.visibility === 'PUBLIC' && book?.visibility === 'PRIVATE';

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      // The whole card starts a drag with the pointer; the card itself is the
      // keyboard handle (focus it, Space, then arrows). The grip is only a hint.
      {...attributes}
      {...listeners}
      role="listitem"
      aria-label={
        collection.isOwner
          ? t('collection.dragHandle', { title: entry.title })
          : undefined
      }
      className={cn(
        'relative outline-none focus-visible:ring-2 focus-visible:ring-ring',
        collection.isOwner && 'cursor-grab select-none',
        isDragging && 'z-10 cursor-grabbing shadow-lg',
      )}
    >
      <Card className={entry.isGhost ? 'border-dashed opacity-80' : undefined}>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
          {collection.isOwner && (
            <GripVerticalIcon
              className="-mr-3 -ml-1 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          )}

          <span className="w-8 shrink-0 text-center text-sm text-muted-foreground tabular-nums">
            {index + 1}
          </span>

          <span
            aria-hidden="true"
            className="flex h-16 w-11 shrink-0 items-center justify-center overflow-hidden bg-muted text-muted-foreground"
          >
            {entry.coverUrl ? (
              <img
                src={entry.coverUrl}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <BookOpenIcon className="size-4" />
            )}
          </span>

          <div className="min-w-0 flex-[1_1_10rem]">
            {entry.isGhost || !book ? (
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-medium">
                  <LockIcon
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="truncate">{entry.title}</span>
                  <Badge variant="secondary">
                    {t('collection.ghostBadge')}
                  </Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('collection.ghostBookDescription')}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/library/$bookId"
                  params={{ bookId: book.id }}
                  className="block truncate font-medium hover:underline focus-visible:underline"
                >
                  {book.title}
                </Link>
                <p className="truncate text-sm text-muted-foreground">
                  {authorNames || t('book.unknownAuthor')}
                </p>
              </div>
            )}
          </div>

          {!entry.isGhost && book && (
            <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
              {isHiddenFromOthers ? (
                <Badge variant="outline">
                  {t('collection.hiddenFromOthers')}
                </Badge>
              ) : (
                book.visibility === 'PUBLIC' && (
                  <Badge variant="secondary">{t('book.publicBadge')}</Badge>
                )
              )}
            </div>
          )}

          {collection.isOwner && (
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={t('collection.removeBook', { title: entry.title })}
                title={t('collection.removeBook', { title: entry.title })}
                disabled={removeBook.isPending}
                onClick={() =>
                  removeBook.mutate({
                    path: { collectionId: collection.id, bookId: entry.bookId },
                  })
                }
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </li>
  );
}
