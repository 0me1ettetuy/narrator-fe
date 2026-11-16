import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookmarkPlusIcon, BookmarkXIcon, Undo2Icon } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerListBooksQueryKey,
  booksControllerListPublicBooksQueryKey,
  collectionsControllerAddBookMutation,
  collectionsControllerAddToLibraryMutation,
  collectionsControllerGetCollectionOptions,
  collectionsControllerGetCollectionQueryKey,
  collectionsControllerListCollectionsQueryKey,
  collectionsControllerListPublicCollectionsQueryKey,
  collectionsControllerRemoveBookMutation,
  collectionsControllerRemoveFromLibraryMutation,
  collectionsControllerReorderBooksMutation,
  collectionsControllerUpdateCollectionMutation,
  collectionsControllerUpdateVisibilityMutation,
  getApiErrorTranslationKey,
  type CollectionBookEntryResponseDto,
  type CollectionSummaryResponseDto,
} from '@/shared/api';
import { ISLAND_PRIORITY } from '@/shared/config';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DataState } from '@/shared/ui/data-state';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Card, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { toast } from '@/shared/ui/toast';
import { preloadBook3D } from '@/entities/book';
import { ChangesItem, IslandItem } from '@/widgets/island';
import { AddBooksDialog } from './AddBooksDialog';
import { CollectionBookList } from './CollectionBookList';
import { CollectionVisibilityToggle } from './CollectionVisibilityToggle';
import { DeleteCollectionButton } from './DeleteCollectionButton';
import {
  diffBookIds,
  getBooksBlockingPublish,
  getBooksToPublish,
} from '../model/collection-books';

// three.js is heavy: the pile loads when the page opens, and the chunk starts
// downloading with it.
const loadPile = () => import('./CollectionBookPile');
const CollectionBookPile = lazy(loadPile);
void loadPile();
preloadBook3D();

type CollectionPageProps = {
  collectionId: string;
};

export function CollectionPage({ collectionId }: CollectionPageProps) {
  const detailQuery = useQuery(
    collectionsControllerGetCollectionOptions({ path: { collectionId } }),
  );

  return (
    <DataState query={detailQuery} isEmpty={() => false}>
      {(data) => (
        <CollectionLoaded collection={data.collection} books={data.books} />
      )}
    </DataState>
  );
}

// The loaded collection. Everything the owner changes here (the title, the
// description, public or private, books added or removed, their order) is a
// draft shown at once and kept as a difference from what the server has. The
// island's Save changes sends it in one go; Discard drops it.
function CollectionLoaded({
  collection,
  books,
}: {
  collection: CollectionSummaryResponseDto;
  books: CollectionBookEntryResponseDto[];
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState<string | null>(null);
  const [visibilityDraft, setVisibilityDraft] = useState<
    CollectionSummaryResponseDto['visibility'] | null
  >(null);
  // The draft book list: every id in order, added books included.
  const [order, setOrder] = useState<string[] | null>(null);
  const [addedBooks, setAddedBooks] = useState<
    Record<string, CollectionBookEntryResponseDto>
  >({});
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingStep, setSavingStep] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<unknown>(null);
  const updateCollection = useMutation(
    collectionsControllerUpdateCollectionMutation(),
  );
  const updateVisibility = useMutation(
    collectionsControllerUpdateVisibilityMutation(),
  );
  const addBook = useMutation(collectionsControllerAddBookMutation());
  const removeBook = useMutation(collectionsControllerRemoveBookMutation());
  const reorderBooks = useMutation(collectionsControllerReorderBooksMutation());

  const title = titleDraft ?? collection.title;
  const description = descriptionDraft ?? collection.description ?? '';
  const visibility = visibilityDraft ?? collection.visibility;
  const isPublic = visibility === 'PUBLIC';
  const serverById = new Map(books.map((entry) => [entry.bookId, entry]));
  const draftIds = order ?? books.map((entry) => entry.bookId);
  const entries = draftIds.flatMap(
    (id) => serverById.get(id) ?? addedBooks[id] ?? [],
  );
  const { added, removed, isReordered } = diffBookIds(
    books.map((entry) => entry.bookId),
    draftIds,
  );

  const isTitleValid = title.trim().length > 0;
  const isTitleChanged = title.trim() !== collection.title;
  const isDescriptionChanged =
    description.trim() !== (collection.description ?? '');
  const isVisibilityChanged = visibility !== collection.visibility;
  const changeCount =
    Number(isTitleChanged) +
    Number(isDescriptionChanged) +
    Number(isVisibilityChanged) +
    added.length +
    removed.length +
    Number(isReordered);
  // The owner's private books that saving makes public: all of them when the
  // collection goes public, otherwise only the ones being added to a public one.
  const booksToPublish = isPublic
    ? getBooksToPublish(entries).filter(
        (entry) => isVisibilityChanged || added.includes(entry.bookId),
      )
    : [];
  const blockError = !isTitleValid
    ? t('collection.titleRequired')
    : booksToPublish.some((entry) => entry.book?.parseStatus !== 'READY')
      ? t('collection.notReadyHint')
      : null;
  const summary = [
    [isTitleChanged, t('collection.islandTitle')],
    [isDescriptionChanged, t('collection.islandDescription')],
    [
      isVisibilityChanged,
      t(
        isPublic
          ? 'collection.islandMadePublic'
          : 'collection.islandMadePrivate',
      ),
    ],
    [added.length > 0, t('collection.islandAdded', { count: added.length })],
    [
      removed.length > 0,
      t('collection.islandRemoved', { count: removed.length }),
    ],
    [isReordered, t('collection.islandReordered')],
  ]
    .filter(([isShown]) => isShown)
    .map(([, label]) => label)
    .join(' · ');

  function discard() {
    setTitleDraft(null);
    setDescriptionDraft(null);
    setVisibilityDraft(null);
    setOrder(null);
    setAddedBooks({});
    setSaveError(null);
  }

  async function save() {
    if (blockError || isSaving) return;
    const path = { collectionId: collection.id };
    // Going private first and public last, so adding books needs no
    // confirmation in between (a private collection takes any book).
    const isStayingPublic = collection.visibility === 'PUBLIC' && isPublic;
    let saveFailed = false;
    setIsSaving(true);
    setSaveError(null);
    try {
      if (isTitleChanged || isDescriptionChanged) {
        setSavingStep(t('collection.stepDetails'));
        await updateCollection.mutateAsync({
          path,
          body: {
            title: title.trim(),
            description: description.trim() || null,
          },
        });
      }
      if (isVisibilityChanged && !isPublic) {
        setSavingStep(t('collection.stepVisibility'));
        await updateVisibility.mutateAsync({
          path,
          body: { visibility: 'PRIVATE' },
        });
      }
      if (removed.length > 0 || added.length > 0) {
        setSavingStep(t('collection.stepBooks'));
      }
      for (const bookId of removed) {
        await removeBook.mutateAsync({ path: { ...path, bookId } });
      }
      for (const bookId of added) {
        await addBook.mutateAsync({
          path,
          body: {
            bookId,
            makePublic:
              isStayingPublic &&
              addedBooks[bookId]?.book?.visibility === 'PRIVATE'
                ? true
                : undefined,
          },
        });
      }
      if (isReordered) {
        setSavingStep(t('collection.stepOrder'));
        await reorderBooks.mutateAsync({ path, body: { bookIds: draftIds } });
      }
      if (isVisibilityChanged && isPublic) {
        setSavingStep(t('collection.stepVisibility'));
        await updateVisibility.mutateAsync({
          path,
          body: { visibility: 'PUBLIC' },
        });
      }
    } catch (error) {
      setSaveError(error);
      saveFailed = true;
    }
    // Refreshed even after a failure: what did get saved stops counting as a
    // change, and the rest stays in the draft.
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: collectionsControllerGetCollectionQueryKey({ path }),
      }),
      queryClient.invalidateQueries({
        queryKey: collectionsControllerListCollectionsQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: collectionsControllerListPublicCollectionsQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: booksControllerListBooksQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: booksControllerListPublicBooksQueryKey(),
      }),
    ]);
    setIsSaving(false);
    setSavingStep(null);
    if (!saveFailed) {
      discard();
      toast.add({ title: t('collection.changesSaved'), type: 'success' });
    }
  }

  return (
    <section className="flex w-full flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8 lg:h-[calc(100svh-3.5rem)]">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          {collection.isOwner ? (
            <>
              <DeleteCollectionButton
                collectionId={collection.id}
                title={collection.title}
              />
              <div className="ml-auto">
                <AddBooksDialog
                  entries={entries}
                  onAdd={(book) => {
                    setAddedBooks((current) => ({
                      ...current,
                      [book.id]: {
                        bookId: book.id,
                        title: book.title,
                        position: 0,
                        isGhost: false,
                        coverUrl: book.coverUrl,
                        wordCount: book.wordCount,
                        book,
                      },
                    }));
                    setOrder([...draftIds, book.id]);
                  }}
                />
              </div>
            </>
          ) : (
            <SaveCollectionButton collection={collection} />
          )}
        </div>
      </header>

      {/* One viewport, no page scroll: the collection on the left (visibility,
          title, the books as a pile, description), the books scrolling inside
          the right one. Same 1:2 split as Home; stacked below lg. The scrollbar
          is hidden so the cards end where the button row above ends. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-rows-[minmax(0,1fr)]">
        <Card className="lg:min-h-0 lg:overflow-y-auto">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isPublic ? 'secondary' : 'outline'}>
                {isPublic
                  ? t('book.publicBadge')
                  : t('collection.privateBadge')}
              </Badge>
              <span>
                {t('library.bookCount', {
                  count: entries.filter((entry) => !entry.isGhost).length,
                })}
              </span>
            </div>
            {collection.isOwner && (
              <CollectionVisibilityToggle
                isPublic={isPublic}
                isBlocked={getBooksBlockingPublish(entries).length > 0}
                onToggle={() =>
                  setVisibilityDraft(isPublic ? 'PRIVATE' : 'PUBLIC')
                }
              />
            )}
          </CardContent>
          <CardContent className="space-y-2">
            {collection.isOwner ? (
              <>
                <h1 className="sr-only">{collection.title}</h1>
                <Label htmlFor="collection-title">
                  {t('collection.titleLabel')}
                </Label>
                <Input
                  id="collection-title"
                  value={title}
                  maxLength={200}
                  aria-invalid={!isTitleValid}
                  disabled={isSaving}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur();
                  }}
                />
              </>
            ) : (
              <h1 className="font-heading text-2xl font-semibold tracking-tight break-words">
                {collection.title}
              </h1>
            )}
          </CardContent>
          {/* The books as a pile seen from the side; three.js loads on demand. */}
          <CardContent className="min-h-0 flex-1">
            <Suspense fallback={<Skeleton className="size-full min-h-64" />}>
              <CollectionBookPile entries={entries} />
            </Suspense>
          </CardContent>
          {collection.isOwner ? (
            <CardContent className="space-y-2">
              <Label htmlFor="collection-description">
                {t('collection.descriptionLabel')}
              </Label>
              <Textarea
                id="collection-description"
                value={description}
                maxLength={1000}
                rows={4}
                disabled={isSaving}
                onChange={(event) => setDescriptionDraft(event.target.value)}
              />
            </CardContent>
          ) : (
            collection.description && (
              <CardContent>
                <p className="text-muted-foreground">
                  {collection.description}
                </p>
              </CardContent>
            )
          )}
        </Card>
        {/* p-px keeps the rows' 1px rings from being clipped by the scroll box. */}
        <div className="p-px lg:min-h-0 lg:overflow-y-auto lg:[scrollbar-width:none]">
          <CollectionBookList
            collection={collection}
            entries={entries}
            onReorder={setOrder}
            onRemove={(bookId) =>
              setOrder(draftIds.filter((id) => id !== bookId))
            }
          />
        </div>
      </div>

      {(changeCount > 0 || isSaving) && (
        <IslandItem
          id="collection-changes"
          priority={ISLAND_PRIORITY.changes}
          draggable={false}
        >
          <ChangesItem
            count={changeCount}
            summary={summary}
            warning={
              booksToPublish.length > 0
                ? t('collection.islandPublishes', {
                    count: booksToPublish.length,
                  })
                : null
            }
            error={
              blockError ??
              (saveError ? t(getApiErrorTranslationKey(saveError)) : null)
            }
            savingStep={savingStep}
            isSaving={isSaving}
            onDiscard={() => setIsDiscardOpen(true)}
            onSave={() => void save()}
          />
        </IslandItem>
      )}

      <AlertDialog open={isDiscardOpen} onOpenChange={setIsDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia variant="destructive">
              <Undo2Icon aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>{t('book.discardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('book.discardDescription', { count: changeCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus>
              {t('common.cancel')}
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setIsDiscardOpen(false);
                discard();
              }}
            >
              {t('book.discard')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

// Duplicates the save toggle in CollectionCard: pages can't import each other.
function SaveCollectionButton({
  collection,
}: {
  collection: CollectionSummaryResponseDto;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: collectionsControllerGetCollectionQueryKey({
          path: { collectionId: collection.id },
        }),
      }),
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
