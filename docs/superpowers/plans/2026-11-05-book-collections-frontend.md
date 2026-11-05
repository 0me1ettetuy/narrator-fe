# Book Collections Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users create, share, save, and browse book collections, and show ghosts for books and collections that went private.

**Architecture:** `/library` gets a **Collections** tab and Community gets a Books/Collections switch. A new `pages/collection` slice owns the collection page. `features/add-to-collection` holds the one add action shared by the book page and collection page, including the publish warning.

**Tech Stack:** React, TanStack Router and Query, Hey API generated client, TanStack Form with Zod, i18next, shadcn primitives in `src/shared/ui`.

**Spec:** `../narrator-general-api/docs/superpowers/specs/2026-11-05-book-collections-design.md`. Read it first.

## Global Constraints

- Finish the backend plan first. Its routes must be running for Task 1.
- Work in `narrator-fe`. Create a branch first: `git checkout -b feat/book-collections`.
- There is no frontend test runner, so don't add one. Verify with `pnpm build`, `pnpm lint`, `pnpm format:check`, and the manual checks in Task 6.
- Never edit `src/app/routeTree.gen.ts` or `src/shared/api/generated/`.
- Import generated API code only through `@/shared/api`, and import other slices through their `index.ts`.
- Every visible string goes in both `src/shared/i18n/en.ts` and `ru.ts`.
- Show errors with `t(getApiErrorTranslationKey(error))`, never a backend message.
- Icon-only buttons need `aria-label` and `title`.
- Don't nest a button inside a `Link`. Put it beside the link, as `LibraryBookCard` does.
- Use `AlertDialog` for confirmations, following `VisibilityToggle` in `src/pages/book/ui/BookPage.tsx`.
- Each commit message ends with the attribution line required by the session.

## Review Focus

1. The public warning must list exactly the owner's private books. Check it with a collection holding public, private, and ghost books.
2. A ghost must never render a cover or a link to its book page, because both would 404.
3. A collection tab with only ghosts must show them, not the empty state.
4. After a collection goes public, the book page must show the `Public` badge without a reload. Task 4 invalidates each changed book.
5. Reordering must send every book id including ghosts, or the API returns 400.

---

### Task 1: Client, error codes, and translations

**Files:**

- Modify: `src/shared/api/index.ts`
- Modify: `src/shared/api/api-error.ts`
- Modify: `src/shared/i18n/en.ts`
- Modify: `src/shared/i18n/ru.ts`

**Interfaces:**

- Produces: the exports below from `@/shared/api`, and the `collection.*` translation keys.

- [ ] **Step 1: Regenerate the client**

In `narrator-general-api`, on the backend branch, run `docker compose up -d db redis` and start `pnpm start:dev` in the background. Then in `narrator-fe`:

Run: `pnpm api:generate`
Expected: `src/shared/api/generated/@tanstack/react-query.gen.ts` contains `collectionsControllerListCollectionsOptions`.

Stop the backend afterwards. If you get a generator error, read the newest `openapi-ts-error-*.log` file.

- [ ] **Step 2: Export the generated code from `src/shared/api/index.ts`**

Add to the `./generated/@tanstack/react-query.gen` export list, keeping it alphabetical:

```ts
collectionsControllerAddBookMutation,
collectionsControllerAddToLibraryMutation,
collectionsControllerCreateCollectionMutation,
collectionsControllerDeleteCollectionMutation,
collectionsControllerGetCollectionOptions,
collectionsControllerGetCollectionQueryKey,
collectionsControllerListCollectionsOptions,
collectionsControllerListCollectionsQueryKey,
collectionsControllerListPublicCollectionsOptions,
collectionsControllerListPublicCollectionsQueryKey,
collectionsControllerRemoveBookMutation,
collectionsControllerRemoveFromLibraryMutation,
collectionsControllerReorderBooksMutation,
collectionsControllerUpdateCollectionMutation,
collectionsControllerUpdateVisibilityMutation,
```

Add to the type export list:

```ts
CollectionBookEntryResponseDto,
CollectionDetailResponseDto,
CollectionGhostResponseDto,
CollectionSummaryResponseDto,
GhostBookResponseDto,
```

- [ ] **Step 3: Add the error codes to `apiErrorTranslationKeys`**

```ts
COLLECTION_BOOK_NOT_PUBLIC: 'errors.collectionBookNotPublic',
COLLECTION_BOOKS_NOT_READY: 'errors.collectionBooksNotReady',
```

- [ ] **Step 4: Add translations**

In the `errors` block:

| Key                       | English                                                     | Russian                                                              |
| ------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| `collectionBookNotPublic` | `This book must be public to join a public collection.`     | `Чтобы попасть в публичную коллекцию, книга должна быть публичной.`  |
| `collectionBooksNotReady` | `Wait for every book to finish processing, then try again.` | `Дождитесь окончания обработки всех книг и повторите попытку.`       |

In `navigation`, add `collection`: `Collection` / `Коллекция`.

In `library`, add:

| Key                           | English                                            | Russian                                             |
| ----------------------------- | -------------------------------------------------- | --------------------------------------------------- |
| `collectionsTab`              | `Collections`                                      | `Коллекции`                                         |
| `communityBooks`              | `Books`                                            | `Книги`                                             |
| `communityCollections`        | `Collections`                                      | `Коллекции`                                         |
| `communityKindLabel`          | `Browse`                                           | `Показать`                                          |
| `browseCollectionsEmptyTitle` | `No public collections found`                      | `Публичные коллекции не найдены`                    |
| `browseCollectionsEmptyDescription` | `Try another search, or share one of your own.` | `Измените запрос или поделитесь своей коллекцией.` |

Add a new top-level `collection` block to both files, after `book`:

| Key                       | English                                                                                       | Russian                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `create`                  | `Create collection`                                                                           | `Создать коллекцию`                                                                                      |
| `creating`                | `Creating…`                                                                                   | `Создание…`                                                                                              |
| `createDescription`       | `Group books in the order they should be read. Collections start private.`                    | `Сгруппируйте книги в порядке чтения. Новые коллекции приватны.`                                         |
| `edit`                    | `Edit collection`                                                                             | `Изменить коллекцию`                                                                                     |
| `save`                    | `Save changes`                                                                                | `Сохранить изменения`                                                                                    |
| `saving`                  | `Saving…`                                                                                     | `Сохранение…`                                                                                            |
| `titleLabel`              | `Title`                                                                                       | `Название`                                                                                               |
| `titleRequired`           | `Enter a title.`                                                                              | `Введите название.`                                                                                      |
| `titleTooLong`            | `Use 200 characters or fewer.`                                                                | `Используйте не более 200 символов.`                                                                     |
| `descriptionLabel`        | `Description (optional)`                                                                      | `Описание (необязательно)`                                                                               |
| `descriptionTooLong`      | `Use 1,000 characters or fewer.`                                                              | `Используйте не более 1000 символов.`                                                                    |
| `emptyTitle`              | `No collections yet`                                                                          | `Коллекций пока нет`                                                                                     |
| `emptyDescription`        | `Create one to group a series or trilogy.`                                                    | `Создайте коллекцию, чтобы объединить серию или трилогию.`                                               |
| `noBooksTitle`            | `No books in this collection`                                                                 | `В этой коллекции нет книг`                                                                              |
| `noBooksOwnerDescription` | `Add books from your library.`                                                                | `Добавьте книги из своей библиотеки.`                                                                    |
| `noBooksDescription`      | `The owner hasn't shared any books here yet.`                                                 | `Владелец пока не поделился здесь книгами.`                                                              |
| `open`                    | `Open collection {{title}}`                                                                   | `Открыть коллекцию {{title}}`                                                                            |
| `privateBadge`            | `Private`                                                                                     | `Приватная`                                                                                              |
| `makePublic`              | `Make public`                                                                                 | `Сделать публичной`                                                                                      |
| `makePublicTitle`         | `Make this collection public?`                                                                | `Сделать коллекцию публичной?`                                                                           |
| `makePublicDescription`   | `Any signed-in user will be able to view this collection.`                                    | `Любой вошедший пользователь сможет просматривать эту коллекцию.`                                        |
| `makePublicBooksWarning`  | `These books will be made public too:`                                                        | `Эти книги тоже станут публичными:`                                                                      |
| `makePrivate`             | `Make private`                                                                                | `Сделать приватной`                                                                                      |
| `madePrivate`             | `Collection is private. Its books are still public.`                                          | `Коллекция приватна. Её книги остаются публичными.`                                                      |
| `notReadyHint`            | `These books must finish processing before this collection can be public:`                    | `Эти книги должны завершить обработку, прежде чем коллекцию можно будет сделать публичной:`              |
| `hiddenFromOthers`        | `Hidden from others`                                                                          | `Скрыта от других`                                                                                       |
| `delete`                  | `Delete collection`                                                                           | `Удалить коллекцию`                                                                                      |
| `deleting`                | `Deleting…`                                                                                   | `Удаление…`                                                                                              |
| `deleteTitle`             | `Delete this collection?`                                                                     | `Удалить коллекцию?`                                                                                     |
| `deleteDescription`       | `"{{title}}" will be removed for everyone who saved it. The books won't be deleted.`          | `«{{title}}» исчезнет у всех, кто её сохранил. Книги не будут удалены.`                                  |
| `keep`                    | `Keep collection`                                                                             | `Оставить коллекцию`                                                                                     |
| `deleted`                 | `Deleted {{title}}`                                                                           | `Коллекция «{{title}}» удалена`                                                                          |
| `saveToLibrary`           | `Save collection`                                                                             | `Сохранить коллекцию`                                                                                    |
| `removeFromLibrary`       | `Remove from saved`                                                                           | `Убрать из сохранённых`                                                                                  |
| `addBooks`                | `Add books`                                                                                   | `Добавить книги`                                                                                         |
| `addBooksDescription`     | `Pick books from your library.`                                                               | `Выберите книги из своей библиотеки.`                                                                    |
| `addToCollection`         | `Add to collection`                                                                           | `Добавить в коллекцию`                                                                                   |
| `addToCollectionDescription` | `Pick a collection for this book.`                                                         | `Выберите коллекцию для этой книги.`                                                                     |
| `noCollectionsYet`        | `Create a collection on the Collections tab first.`                                           | `Сначала создайте коллекцию на вкладке «Коллекции».`                                                     |
| `goToCollections`         | `Go to library`                                                                               | `Перейти в библиотеку`                                                                                   |
| `noBooksToAdd`            | `Your library has no books to add.`                                                           | `В вашей библиотеке нет книг для добавления.`                                                            |
| `add`                     | `Add`                                                                                         | `Добавить`                                                                                               |
| `added`                   | `Added`                                                                                       | `Добавлено`                                                                                              |
| `addLabel`                | `Add {{book}} to {{collection}}`                                                              | `Добавить «{{book}}» в «{{collection}}»`                                                                 |
| `publishOnAddTitle`       | `Make this book public?`                                                                      | `Сделать книгу публичной?`                                                                               |
| `publishOnAddDescription` | `"{{collection}}" is public, so "{{book}}" will be made public when you add it.`              | `Коллекция «{{collection}}» публичная, поэтому книга «{{book}}» станет публичной после добавления.`      |
| `publishAndAdd`           | `Make public and add`                                                                         | `Сделать публичной и добавить`                                                                           |
| `bookNotReady`            | `This book can join a public collection once it finishes processing.`                         | `Книгу можно будет добавить в публичную коллекцию после обработки.`                                      |
| `removeBook`              | `Remove {{title}} from this collection`                                                       | `Убрать «{{title}}» из коллекции`                                                                        |
| `moveUp`                  | `Move {{title}} up`                                                                           | `Переместить «{{title}}» выше`                                                                           |
| `moveDown`                | `Move {{title}} down`                                                                         | `Переместить «{{title}}» ниже`                                                                           |
| `ghostBookDescription`    | `The owner made this book private. Keep it here in case it's made public again, or remove it.` | `Владелец сделал эту книгу приватной. Оставьте её здесь на случай, если она снова станет публичной, или удалите.` |
| `ghostCollectionDescription` | `The owner made this collection private. Keep it here in case it's made public again, or remove it.` | `Владелец сделал эту коллекцию приватной. Оставьте её здесь на случай, если она снова станет публичной, или удалите.` |
| `ghostBadge`              | `Private`                                                                                     | `Приватная`                                                                                              |
| `removeGhost`             | `Remove {{title}}`                                                                            | `Удалить «{{title}}»`                                                                                    |

- [ ] **Step 5: Verify**

Run: `pnpm exec tsc -b`
Expected: exit code 0. `ru.ts` is checked against the type of `en.ts`, so a missing key fails here. `listBooks` still compiles because `ghosts` is only an added field.

- [ ] **Step 6: Commit**

`src/shared/api/generated/` is ignored, so it won't be staged.

```bash
git add src/shared/api/index.ts src/shared/api/api-error.ts src/shared/i18n/en.ts src/shared/i18n/ru.ts
git commit -m "feat: add collections client exports and translations"
```

---

### Task 2: Ghost books in the library

**Files:**

- Create: `src/pages/library/ui/GhostCard.tsx`
- Modify: `src/pages/library/ui/LibraryPage.tsx`

**Interfaces:**

- Produces: this component, also used for ghost collections in Task 3:

```tsx
type GhostCardProps = {
  title: string;
  description: string;
  removeLabel: string;
  isRemoving: boolean;
  onRemove: () => void;
};
export function GhostCard(props: GhostCardProps): JSX.Element;
```

- [ ] **Step 1: Create `GhostCard`**

Use `Card`, `CardHeader`, `CardTitle`, and `CardDescription` with `className="h-full gap-0 border-dashed py-0 opacity-80"`. Show:

- The same 16:9 muted placeholder as `LibraryBookCard`, using `LockIcon` instead of `BookOpenIcon`.
- The title, then `Badge variant="secondary"` with `t('collection.ghostBadge')` in `CardAction`.
- `description` as visible text. Don't truncate it.
- An outline `Button` with `size="sm"`, `Trash2Icon`, visible text `removeLabel`, `disabled={isRemoving}`, and `LoaderCircleIcon` with `animate-spin` while removing.

It has no `Link` and no cover query.

- [ ] **Step 2: Show ghosts in `MyLibraryTab`**

In `LibraryPage.tsx`:

- Change `isEmpty` to `(data) => data.books.length === 0 && data.ghosts.length === 0`.
- Add this component to the file:

```tsx
function GhostBookCard({ ghost }: { ghost: GhostBookResponseDto }) {
  // booksControllerRemoveFromLibraryMutation, invalidating
  // booksControllerListBooksQueryKey() on success.
  // Render GhostCard with:
  //   description: t('collection.ghostBookDescription')
  //   removeLabel: t('collection.removeGhost', { title: ghost.title })
}
```

- After `<LibraryBooks books={data.books} />`, render ghosts in the same grid classes as `LibraryBooks`: `grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3`. Only render the grid if `data.ghosts.length > 0`.

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src/pages/library
git commit -m "feat: show ghost books in the library"
```

---

### Task 3: Collections tab and Community browsing

**Files:**

- Create: `src/pages/library/ui/CollectionCard.tsx`
- Create: `src/pages/library/ui/CollectionsTab.tsx`
- Create: `src/pages/library/ui/CreateCollectionDialog.tsx`
- Create: `src/pages/library/model/collection-form.ts`
- Create: `src/pages/collection/index.ts`
- Create: `src/pages/collection/ui/CollectionPage.tsx`
- Create: `src/app/routes/_authenticated/library/collections.$collectionId.tsx`
- Modify: `src/pages/library/ui/LibraryPage.tsx`

**Interfaces:**

- Consumes: `GhostCard` from Task 2.
- Produces: `/library/collections/$collectionId`, and `CollectionPage({ collectionId }: { collectionId: string })` as a placeholder that Task 4 fills in.

- [ ] **Step 1: Add the route and a placeholder page**

`src/pages/collection/ui/CollectionPage.tsx` exports a component returning `<section />` for now. `src/pages/collection/index.ts` exports it.

```tsx
// src/app/routes/_authenticated/library/collections.$collectionId.tsx
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
```

Run: `pnpm exec vite build`
Expected: the router plugin adds the route to `src/app/routeTree.gen.ts`. Run this before `tsc`, otherwise `Link` to the new route fails type checks.

- [ ] **Step 2: Create `collection-form.ts`**

```ts
import { z } from 'zod';

export const collectionFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'collection.titleRequired')
    .max(200, 'collection.titleTooLong'),
  description: z.string().trim().max(1000, 'collection.descriptionTooLong'),
});
```

Before using these as translation keys, check `src/pages/login/model/login.ts` and `src/pages/login/ui/LoginPage.tsx`. Follow however those pass Zod messages to `FieldError`.

`CollectionPage` also needs this schema for editing. Pages can't import each other, so Task 4 keeps its own copy. That matches the FSD rule that small duplicates between pages are acceptable.

- [ ] **Step 3: Create `CreateCollectionDialog`**

Props: `{ open: boolean; onOpenChange: (open: boolean) => void }`.

- Use `Dialog`, following the upload dialog in `LibraryPage.tsx`.
- Use `useForm` from TanStack Form with `validators: { onSubmit: collectionFormSchema }`, following `LoginPage.tsx`.
- Use `Input` for the title and `Textarea` for the description, each with a visible `Label`.
- Submit through `collectionsControllerCreateCollectionMutation`, with body `{ title, description: description || undefined }`.
- On success, invalidate `collectionsControllerListCollectionsQueryKey()`, reset the form, close the dialog, and navigate to `/library/collections/$collectionId` with the new id.
- Show mutation errors with `role="alert"`.
- Disable submit while pending, and show `t('collection.creating')`.

- [ ] **Step 4: Create `CollectionCard`**

Props: `{ collection: CollectionSummaryResponseDto }`.

- Wrap it in a `div` with `className="relative"`, and link to `/library/collections/$collectionId` with `aria-label={t('collection.open', { title })}`.
- Query the cover with `booksControllerGetBookCoverAccessOptions({ path: { bookId: collection.coverBookId ?? '' } })`, with `enabled: collection.coverBookId !== null` and `staleTime: 14 * 60 * 1_000`.
- Show the same cover and placeholder markup as `LibraryBookCard`, with `LibraryBigIcon` as the placeholder.
- Show the title, description if there is one, and `t('library.bookCount', { count: collection.bookCount })`.
- Show a `Badge`: `t('book.publicBadge')` for public, or `t('collection.privateBadge')` for private.
- For a non-owner, show a save toggle beneath the card, following `AddToLibraryToggle` in `PublicLibraryBooks.tsx`:
  - `collectionsControllerAddToLibraryMutation` or `collectionsControllerRemoveFromLibraryMutation`, using `path: { collectionId }`.
  - Labels `collection.saveToLibrary` and `collection.removeFromLibrary`.
  - On success, invalidate both collection list query keys.

- [ ] **Step 5: Create `CollectionsTab`**

- Query `collectionsControllerListCollectionsOptions({ query: { limit: 50, source: 'all' } })`.
- Show a `collection.create` button at the top right, with `PlusIcon`, which opens `CreateCollectionDialog`.
- Use `DataState` with `isEmpty={(data) => data.collections.length === 0 && data.ghosts.length === 0}`, `LibraryBooksSkeleton` for loading, and an `Empty` using `collection.emptyTitle`, `collection.emptyDescription`, and a create button.
- Render `CollectionCard` items, then ghosts, in one grid.
- Each ghost uses `GhostCard` with `collection.ghostCollectionDescription`. Removing calls `collectionsControllerRemoveFromLibraryMutation` with `path: { collectionId: ghost.collectionId }`, then invalidates `collectionsControllerListCollectionsQueryKey()`.

- [ ] **Step 6: Update `LibraryPage.tsx`**

- Add a tab between `mine` and `community`: value `collections`, label `t('library.collectionsTab')`, content `<CollectionsTab />`.
- In `CommunityLibraryTab`, add `const [kind, setKind] = useState<'books' | 'collections'>('books')`.
- Render a `fieldset` of pill buttons beside the search box, with the same markup as the source filters. Use legend `library.communityKindLabel` and labels `library.communityBooks` and `library.communityCollections`.
- Add `collectionsQuery` with `collectionsControllerListPublicCollectionsOptions({ query: { limit: 24, search: search || undefined } })` and `enabled: kind === 'collections'`.
- Set `enabled: kind === 'books'` on the existing `booksQuery`.
- When `kind === 'collections'`, render a `DataState` of `CollectionCard` items in the standard grid, with an `Empty` using `library.browseCollectionsEmptyTitle` and `library.browseCollectionsEmptyDescription`.

- [ ] **Step 7: Verify**

Run: `pnpm build && pnpm lint && pnpm format:check`
Expected: all pass. If `format:check` fails, run `pnpm format` and repeat.

- [ ] **Step 8: Commit**

`routeTree.gen.ts` is ignored, so it won't be staged.

```bash
git add src/pages/library src/pages/collection src/app/routes
git commit -m "feat: add collections tab and community browsing"
```

---

### Task 4: Collection page

**Files:**

- Modify: `src/pages/collection/ui/CollectionPage.tsx`
- Create: `src/pages/collection/ui/CollectionVisibilityToggle.tsx`
- Create: `src/pages/collection/ui/EditCollectionDialog.tsx`
- Create: `src/pages/collection/ui/DeleteCollectionButton.tsx`
- Create: `src/pages/collection/ui/CollectionBookRow.tsx`
- Create: `src/pages/collection/model/collection-books.ts`

**Interfaces:**

- Produces in `collection-books.ts`:

```ts
import type { CollectionBookEntryResponseDto } from '@/shared/api';

// The owner's private books that going public would publish.
export function getBooksToPublish(
  entries: CollectionBookEntryResponseDto[],
): CollectionBookEntryResponseDto[];

// Books in that list that aren't READY and so block publishing.
export function getBooksBlockingPublish(
  entries: CollectionBookEntryResponseDto[],
): CollectionBookEntryResponseDto[];

// Book ids with one entry moved. Returns ids unchanged at either end.
export function moveBookId(
  bookIds: string[],
  index: number,
  direction: -1 | 1,
): string[];
```

- [ ] **Step 1: Implement `collection-books.ts`**

- `getBooksToPublish`: entries where `entry.book?.isOwner && entry.book.visibility === 'PRIVATE'`.
- `getBooksBlockingPublish`: `getBooksToPublish(entries)` filtered by `entry.book?.parseStatus !== 'READY'`.
- `moveBookId`: copy the array and swap `index` with `index + direction`. Return the copy unchanged if the target is out of range.

Ghosts have `book: null`, so both filters skip them. That's correct, because other users' books are never published.

- [ ] **Step 2: Implement `CollectionVisibilityToggle`**

Props: `{ collection: CollectionSummaryResponseDto; entries: CollectionBookEntryResponseDto[] }`. Follow `VisibilityToggle` in `BookPage.tsx`.

`collectionsControllerUpdateVisibilityMutation` success handler:

```ts
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
  queryClient.invalidateQueries({
    queryKey: booksControllerListBooksQueryKey(),
  }),
  queryClient.invalidateQueries({
    queryKey: booksControllerListPublicBooksQueryKey(),
  }),
  ...getBooksToPublish(entries).map((entry) =>
    queryClient.invalidateQueries({
      queryKey: booksControllerGetBookQueryKey({
        path: { bookId: entry.bookId },
      }),
    }),
  ),
]);
```

If public: show an outline button that calls the mutation with `PRIVATE`, without confirmation. On success, show a toast with `t('collection.madePrivate')`.

If private:

- If `getBooksBlockingPublish(entries)` isn't empty, render a disabled button plus a visible hint: `collection.notReadyHint` and a `ul` of those titles.
- Otherwise, render an `AlertDialog`:
  - Title `collection.makePublicTitle`.
  - Description `collection.makePublicDescription`.
  - If `getBooksToPublish(entries)` isn't empty, add `collection.makePublicBooksWarning` and a `ul` of those titles. Add `max-h-48 overflow-y-auto` for long lists.
  - Show the mutation error with `role="alert"`.
  - Cancel uses `common.cancel`. Confirm uses `collection.makePublic`.

Keep the dialog open on error and close it on success.

- [ ] **Step 3: Implement `EditCollectionDialog`**

Props: `{ collection: CollectionSummaryResponseDto }`. It renders an icon or outline button labelled `collection.edit`, and a dialog with the same form as `CreateCollectionDialog`, with these changes:

- Default values come from the collection, with `description ?? ''`.
- Copy `collectionFormSchema` into this file.
- Submit `collectionsControllerUpdateCollectionMutation` with `path: { collectionId }` and body `{ title, description: description || null }`.
- On success, invalidate the detail and list queries and close the dialog.

- [ ] **Step 4: Implement `DeleteCollectionButton`**

Props: `{ collectionId: string; title: string }`. Follow `DeleteBookButton` in `src/features/delete-book/ui/DeleteBookButton.tsx`, including treating `NOT_FOUND` as success. Use these keys: `collection.delete`, `collection.deleteTitle`, `collection.deleteDescription`, `collection.keep`, `collection.deleting`, `collection.deleted`.

On completion, first navigate to `/library`, then remove the detail query and invalidate the list queries.

- [ ] **Step 5: Implement `CollectionBookRow`**

Props:

```ts
type CollectionBookRowProps = {
  entry: CollectionBookEntryResponseDto;
  collection: CollectionSummaryResponseDto;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isReordering: boolean;
  onMove: (direction: -1 | 1) => void;
};
```

Layout: a `Card` row with position number, title and authors, badges, and owner controls.

- For a ghost:
  - Use a dashed border, show `LockIcon`, the title as plain text, and `collection.ghostBookDescription`.
  - It has no `Link`.
- For a normal book:
  - Link the title to `/library/$bookId`.
  - Show authors, or `t('book.unknownAuthor')`.
  - If `collection.visibility === 'PUBLIC' && entry.book.visibility === 'PRIVATE'`, show a badge with `collection.hiddenFromOthers`. Otherwise, show `book.publicBadge` when the book is public.
- If `collection.isOwner`, show three icon-only buttons with `aria-label` and `title`:
  - Up (`ChevronUpIcon`, `collection.moveUp`): disabled when `!canMoveUp || isReordering`.
  - Down (`ChevronDownIcon`, `collection.moveDown`): disabled when `!canMoveDown || isReordering`.
  - Remove (`Trash2Icon`, `collection.removeBook`): calls `collectionsControllerRemoveBookMutation` with `path: { collectionId, bookId }`, then invalidates the detail and list queries.

The remove action applies to ghosts as well. Ghost rows also get the up and down buttons.

- [ ] **Step 6: Implement `CollectionPage`**

Props: `{ collectionId: string }`.

- Query `collectionsControllerGetCollectionOptions({ path: { collectionId } })`, and wrap it in `DataState` with `isEmpty={() => false}`.
- Use the same section width as the library: `mx-auto max-w-6xl px-4 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-10`.
- Header: title in `h1`, description, `library.bookCount`, and the public or private badge.
- For the owner, show `CollectionVisibilityToggle`, `EditCollectionDialog`, the Task 5 add button, and `DeleteCollectionButton`.
- For a non-owner, show the save toggle from `CollectionCard`, duplicated here because pages can't import each other.
- Render `CollectionBookRow` for each entry.
- For the reorder, use `collectionsControllerReorderBooksMutation`:

```ts
function handleMove(index: number, direction: -1 | 1) {
  reorderBooks.mutate({
    path: { collectionId },
    body: {
      bookIds: moveBookId(
        data.books.map((entry) => entry.bookId),
        index,
        direction,
      ),
    },
  });
}
```

On success, invalidate the detail query. Show a mutation error with `role="alert"` above the list.

- If `data.books` is empty, render `Empty` with `collection.noBooksTitle`. Use `collection.noBooksOwnerDescription` for the owner, and `collection.noBooksDescription` for everyone else.

- [ ] **Step 7: Verify**

Run: `pnpm build && pnpm lint && pnpm format:check`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/pages/collection
git commit -m "feat: add the collection page"
```

---

### Task 5: Add to collection

**Files:**

- Create: `src/features/add-to-collection/index.ts`
- Create: `src/features/add-to-collection/ui/AddToCollectionAction.tsx`
- Create: `src/pages/book/ui/AddToCollectionDialog.tsx`
- Create: `src/pages/collection/ui/AddBooksDialog.tsx`
- Modify: `src/pages/book/ui/BookPage.tsx`
- Modify: `src/pages/collection/ui/CollectionPage.tsx`

**Interfaces:**

- Produces from `@/features/add-to-collection`:

```ts
type AddToCollectionActionProps = {
  collection: { id: string; title: string; visibility: string };
  book: {
    id: string;
    title: string;
    visibility: string;
    parseStatus: string;
  };
  isInCollection: boolean;
};
export function AddToCollectionAction(
  props: AddToCollectionActionProps,
): JSX.Element;
```

- [ ] **Step 1: Implement `AddToCollectionAction`**

Use `collectionsControllerAddBookMutation`. On success:

```ts
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
    queryKey: booksControllerGetBookQueryKey({ path: { bookId: book.id } }),
  }),
  queryClient.invalidateQueries({
    queryKey: booksControllerListBooksQueryKey(),
  }),
  queryClient.invalidateQueries({
    queryKey: booksControllerListPublicBooksQueryKey(),
  }),
]);
```

Render by the first matching case:

| Case                                                                     | Render                                                                                                                  |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `isInCollection`                                                         | Disabled outline button with `CheckIcon` and `collection.added`.                                                        |
| Collection `PUBLIC`, book `PRIVATE`, book not `READY`                    | Disabled outline button with `collection.add`, plus visible `collection.bookNotReady` text.                             |
| Collection `PUBLIC`, book `PRIVATE`                                      | `AlertDialog` with `collection.publishOnAddTitle` and `collection.publishOnAddDescription`. Confirm uses `collection.publishAndAdd` and sends `{ bookId, makePublic: true }`. |
| Otherwise                                                                | Outline button with `collection.add`, sending `{ bookId }`.                                                             |

All buttons use `aria-label={t('collection.addLabel', { book: book.title, collection: collection.title })}`, and show `LoaderCircleIcon` while pending. Show mutation errors with `role="alert"`, and close the dialog on success.

Export it from `src/features/add-to-collection/index.ts`.

- [ ] **Step 2: Implement `AddToCollectionDialog` in `pages/book`**

Props: `{ book: BookDetailResponseDto['book'] }`.

- Trigger: outline `sm` button with `FolderPlusIcon` and `collection.addToCollection`.
- Dialog title `collection.addToCollection`, description `collection.addToCollectionDescription`.
- Only query while open, using `enabled: isOpen`:

```ts
collectionsControllerListCollectionsOptions({
  query: { source: 'owned', limit: 50, bookId: book.id },
});
```

- Add the comment `// shortcut: shows the 50 newest collections, add search if users outgrow it.`
- Use `DataState` with `isEmpty={(data) => data.collections.length === 0}`.
- In the empty state, show `collection.noCollectionsYet` and a `Link` to `/library` labelled `collection.goToCollections`.
- Rows show the collection title, its public or private badge, and `AddToCollectionAction` with `isInCollection={collection.containsBook}`.

- [ ] **Step 3: Add the dialog to `BookPage.tsx`**

In the button group near line 394, render `<AddToCollectionDialog book={book} />` before the owner/non-owner branch, so both see it. Don't change the branch itself.

- [ ] **Step 4: Implement `AddBooksDialog` in `pages/collection`**

Props: `{ collection: CollectionSummaryResponseDto; entries: CollectionBookEntryResponseDto[] }`.

- Trigger: outline `sm` button with `PlusIcon` and `collection.addBooks`.
- Dialog description `collection.addBooksDescription`.
- Query `booksControllerListBooksOptions({ query: { source: 'all', limit: 50 } })` with `enabled: isOpen`.
- Add the comment `// shortcut: shows the 50 newest books, add search if users outgrow it.`
- Empty state text `collection.noBooksToAdd`.
- Rows show the book title and `AddToCollectionAction`. Build `new Set(entries.map((entry) => entry.bookId))` to set `isInCollection`.

Use `ScrollArea` or `max-h-96 overflow-y-auto` for the rows.

- [ ] **Step 5: Add it to `CollectionPage`**

Render `<AddBooksDialog collection={collection} entries={books} />` in the owner controls.

- [ ] **Step 6: Verify**

Run: `pnpm build && pnpm lint && pnpm format:check`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/add-to-collection src/pages/book src/pages/collection
git commit -m "feat: add books to collections with a publish warning"
```

---

### Task 6: Manual check and documentation

**Files:**

- Modify: `CLAUDE.md`
- Modify: `docs/features/README.md` if this repo's copy has the same catalogue table

- [ ] **Step 1: Run both apps**

Start the backend from its branch, and run `pnpm dev` here. Sign in as user A in one browser and user B in a private window.

- [ ] **Step 2: Run the checks**

| #   | Steps                                                                                     | Expected                                                                       |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | A creates a collection and adds two private books.                                        | Collection is private. B gets 404 at its URL.                                  |
| 2   | A clicks **Make public**.                                                                 | Warning lists both titles.                                                     |
| 3   | A confirms, then opens one book.                                                          | Book has the `Public` badge without a reload.                                  |
| 4   | B opens Community, Collections, and saves it.                                             | It appears on B's **Collections** tab.                                         |
| 5   | B adds one of A's books to a private collection of B's, then to B's library.              | Both show the book.                                                            |
| 6   | A makes that book private.                                                                | B sees ghost text in both places, with no cover and no link.                   |
| 7   | A views the public collection.                                                            | The book shows **Hidden from others**. B doesn't see it there.                 |
| 8   | A makes the book public again.                                                            | B's ghosts return as normal books.                                             |
| 9   | A makes the collection private.                                                           | Toast says books stay public. B sees a ghost collection.                       |
| 10  | B removes the ghost collection, then A makes it public again.                             | It stays gone from B's tab.                                                    |
| 11  | A adds a private book to the public collection.                                           | Warning appears. Cancel adds nothing. Confirm publishes and adds it.           |
| 12  | A uploads a book, and adds it to a private collection during processing. A tries public.  | Button is disabled and the hint names the book.                                |
| 13  | With a ghost in A's collection, A moves books up and down.                                | The order saves with no error.                                                 |
| 14  | A deletes a book in the collection.                                                       | It disappears from the collection and from B's library, with no ghost.         |
| 15  | A deletes the collection.                                                                 | A returns to `/library`. It vanishes for B. The books still exist.             |
| 16  | Switch to Russian and repeat one dialog. Check a 375px screen width.                      | No English text. No horizontal page scroll.                                    |

Stop every dev server afterwards.

- [ ] **Step 3: Update `CLAUDE.md`**

Add to "Product behavior to preserve":

```markdown
- `/library`'s **Collections** tab lists owned and saved collections plus ghosts,
  and Community has a **Books / Collections** switch. A collection page lives at
  `/library/collections/$collectionId`. Going public lists the owner's private
  books in a warning first, and the toggle is blocked until they're all `READY`.
  A ghost is a saved or collected item whose owner made it private. It shows
  its title and a remove action, never a cover or link, and it returns on its
  own if made public again. `features/add-to-collection` is shared by the book
  page and collection page.
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md docs/features/README.md
git commit -m "docs: record collections and ghosts"
```
