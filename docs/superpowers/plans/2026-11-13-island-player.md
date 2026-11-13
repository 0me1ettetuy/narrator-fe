# Island Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One app-wide audio player in the island. Playing a chapter loads the whole book as a queue; the player keeps playing across pages; every book remembers its own last chapter and position; the X button only drops the player, never the saved state.

**Architecture:** A `features/audio-player` slice owns the single `<audio>` element, the saved per-book state and the controls UI. It is mounted once in the authenticated layout, so page navigation never touches it. The island shows it as an `IslandItem`; the island gains an ordering model: a default priority per item, a `draggable` flag, and drag-to-reorder, so the Reorganize "changes" item is pinned on top while the player and later generation items can be dragged into the displayed slot. Play entry points: the chapter rows (unchanged look) and a new Play button in the book page details. On a fresh app open, a toast offers to continue the last book. A Play button on library covers is deferred ([issue](../../issues/library-cover-play-button.md)).

**Tech Stack:** React, TanStack Query (generated Hey API options), Zod, localStorage, i18next, Tailwind tokens, existing `Slider`/`Button` primitives.

**Spec:** Design canvas https://claude.ai/artifact/QNn3VDL85mL18qFQ5ufch4, page "Island", boards "Playing — Light / Dark". Island rules: [UI primitives](../../architecture/ui-primitives.md) (Island row) and [history](../../history.md). Status: implemented (Tasks 1–8); manual browser checklist pending a reachable backend. Scope is the player (2 of the 8 unbuilt boards); the generation boards (6) come later and only reuse the priority from Task 1.

## Global Constraints

- FSD: `app → pages → widgets → features → entities → shared`. `features/audio-player` may not import `widgets/island`; the app layer joins them (Task 5). Import slices through their `index.ts`.
- Server state through generated TanStack Query options from `@/shared/api`. No component-level `fetch`. Show localized error codes via `getApiErrorTranslationKey`, never raw messages.
- Every visible string and `aria-label` in `src/shared/i18n/en.ts` with matching `ru.ts` values. New keys live under `player.*`.
- No invented sizes: buttons use `icon-sm` (32px) as in the board; text steps (10/12/13/14px) as in `ChangesItem`.
- Independence: the island knows nothing about what it shows (it renders the items passed to it, and its code names no consumer); the player knows nothing about the island. Only the app layer (`PlayerDock`, composed in `_authenticated.tsx`) joins them (FSD strategy C, compose from the upper layer). A future generation item is added the same way, with no change to island or player code. See Boundaries below.
- Island default priority values (exact): `changes: 30`, `player: 20`, `generation: 10`. They only decide where a newly added item first lands; the user can then drag draggable items.
- Playback speeds cycle in this exact order: `1`, `1.25`, `1.5`, `2`, `0.75`.
- Storage keys (exact), `<userId>` from `useCurrentUser`:
  - `narrator.player.v1:<userId>:<bookId>` holds `{ chapterId, position, speed }` (seconds). One per book; closing the player never deletes it.
  - `narrator.player.active:<userId>` holds the `bookId` whose player is open. Present only while a player is in the island. This is the "was it open last time" flag.
  - `narrator.player.last:<userId>` holds `{ bookId, title }` of the most recently played book. Written on play, kept after X; used only for the resume toast.
- Gate per task: `pnpm exec prettier --write <files>`, then `pnpm build`, `pnpm lint`, `pnpm format:check` pass and the boundary greps under Boundaries print nothing. Leave no dev server running. Commit only if the user has asked for commits.

## Boundaries (FSD check, applies to every task)

- `shared/config`: only constants (`ISLAND_PRIORITY`), imports nothing from other layers.
- `widgets/island`: imports only `shared` and itself (plus `@dnd-kit/*`). It must not import `features/audio-player`, any page, or know the words player/generation.
- `features/audio-player`: imports only `shared` (`api`, `auth`, `ui`, `i18n`, `config`) and itself. It must not import `widgets/island` or any page. Its public API (`index.ts`) is exactly: `PlayerProvider`, `usePlayer`, `PlayerItem`, `PlayBookButton`, `clearAllPlayerState`. Nothing else is reachable from outside.
- `pages/book` (ChapterRow, BookPage) imports `@/features/audio-player` and `@/widgets/island` through their `index.ts` only.
- `app` (`_authenticated.tsx`) is the only place that imports both `features/audio-player` and `widgets/island`.
- Files are named by domain (`queue.ts`, `saved-playback.ts`, `island-order.ts`), never `utils.ts`/`types.ts`.
- Enforcement, run in every task's gate (each must print nothing): `grep -rnE "features/audio-player|from '@/pages" src/widgets/island src/shared`; `grep -rnE "widgets/island|from '@/pages" src/features/audio-player`; `grep -rn "audio-player/\(ui\|model\)" src --include='*.ts*' | grep -v "^src/features/audio-player"`.

## Decisions

1. No tests for now. Checks are manual (Task 8 checklist).
2. Chapter cards keep their current look: play/pause, elapsed time, seek bar, duration. Under the hood they read and drive the shared player (Task 6).
3. Saved state is per book. The X button drops the player and the island item, and keeps that book's saved state. Reload restores only the book that was open (the `active` key).
4. Two ways to start a book, with different rules:
   - **Book play** (book page details, library/home cover): resume. Use the saved chapter and position; with no saved state, the first ready chapter at 0:00.
   - **Chapter play** (a chapter row): the user chose a chapter, so start it at 0:00 and overwrite the saved state with it.
5. **Resume toast on app load.** Island was open when the page unloaded (`active` key present): restore the player paused, no toast (the user just reloaded). Island was not open (`active` absent, so X was pressed or nothing ever played) and a `last` book with saved state exists: show a toast "You left off. Continue listening?" with a Continue button. Continue runs `playBook(last.bookId)` and starts playing (the click is the user gesture browsers require). The toast shows on every app load where the island is not restored, including a reload after X.
6. **Island order.** The island keeps one ordered list, top to bottom. The top slot is the one shown when collapsed (my reading of "view place"). Items with `draggable={false}` (Reorganize changes) are pinned above all draggable ones and cannot be moved or displaced. Draggable items (player, generation) can be dragged to any position among themselves, including the top slot, which makes them the displayed item. A new draggable item first lands by default priority, then the user's drag wins. Order is not saved across reloads.
7. **Drag needs a dependency.** Touch and keyboard drag are required (mobile is a goal), and native HTML5 drag has no touch support. Approved: `@dnd-kit/core` and `@dnd-kit/sortable`.
8. The library/home cover Play button is deferred to an issue; only the book page gets a book Play button now.

## Review Focus

> Standing rule: any later audio regenerate, delete, tag change or similar action must also decide what it does to the player and its saved state. See [docs README](../../README.md#features-that-hold-state-across-actions).

- **Expired signed URL** (paused 14+ minutes, or after reload): on the `<audio>` `error` event refetch the access query once and retry; a second failure skips to the next chapter and shows a localized error line.
- **Audio disappears while loaded** (merge in Reorganize deletes audio, user deletes a chapter's audio): the queue is derived live, so the current entry may vanish; continue with the first ready chapter, paused, or close if none. No crash, no stuck spinner.
- **Saved chapter no longer has audio** when resuming: fall back to the first ready chapter at 0:00 instead of failing.
- **Book play on a book with no ready audio** (the list data does not say whether audio exists): no player appears; show a localized toast `player.noAudio`.
- **Resume toast must not duplicate or lie:** React StrictMode runs effects twice in dev, so give the toast a fixed `id` (`player-resume`). Skip it when the last book has no saved state. If Continue hits a book that is gone or has no audio, the normal `playBook` paths apply (close, toast `player.noAudio`, clear that book's state and the `last` key). Never show it while the island was restored.
- **Reload and autoplay blocking:** restore paused; never call `play()` without a user gesture. Corrupt or old-shape localStorage is ignored, not thrown.
- **Book no longer readable** (made private, deleted, 403/404): close the player and delete that book's saved state.
- **Unsaved changes on top:** while Reorganize shows its item, a collapsed island hides the player controls; the "N more" toggle reaches them. Accepted, documented in Task 8.
- **Drag accessibility and edge cases:** every drag handle has a keyboard path (focus handle, arrow keys move the item) and an `aria-label`; an item that unmounts mid-drag (player closed) cancels the drag cleanly; a draggable item can never be dropped above a pinned one; with one draggable item there is no handle.
- **Logout** removes every `narrator.player.*:<userId>*` key so the next user on the device sees nothing.

---

## Task 1: Island ordering model

**Files:**

- Create: `src/widgets/island/model/island-order.ts`, `src/shared/config/island-priority.ts`, `src/shared/config/index.ts`
- Modify: `src/widgets/island/model/island-context.ts`, `src/widgets/island/model/IslandProvider.tsx`, `src/widgets/island/ui/IslandItem.tsx`, `src/widgets/island/ui/Island.tsx`, `src/widgets/island/index.ts`, `src/pages/book/ui/ChapterReorganizePage.tsx` (the `IslandItem` with `id="reorganize-changes"`)

**Interfaces:**

- Produces, exported from `@/widgets/island`: `IslandItem` props `{ id: string; priority?: number; draggable?: boolean; children: ReactNode }` (`priority` defaults to `0`, `draggable` to `true`). The island exports no priority names.
- Produces in `shared/config`: `ISLAND_PRIORITY = { changes: 30, player: 20, generation: 10 } as const`, exported from `@/shared/config` (a shared registry of default placements, like route constants, so neither island nor features hard-code each other's values).
- Produces (`island-order.ts`, pure):
  - `type OrderEntry = { id: string; priority: number; draggable: boolean }`
  - `insertEntry(order: OrderEntry[], entry: OrderEntry): OrderEntry[]`: pinned (`draggable: false`) entries stay first; a pinned entry goes among pinned by priority (ties: newest on top); a draggable entry goes among draggable ones before the first with a lower priority, else at the end of that block. Re-registering an id replaces it.
  - `moveEntry(order: OrderEntry[], id: string, toIndex: number): OrderEntry[]`: no-op for a pinned `id`; `toIndex` is clamped so a draggable entry never lands above the pinned block.
- Context: `ids: string[]` becomes `items: OrderEntry[]` (display order, top first); `register(entry: OrderEntry): () => void`; `move(id: string, toIndex: number): void`; `topId: string | null` (`items[0]?.id`).

- [ ] **Step 1:** Implement `insertEntry` and `moveEntry`.
- [ ] **Step 2:** Provider holds `items` with `insertEntry` on register, removal on unregister, `moveEntry` on `move`.
- [ ] **Step 3:** `IslandItem` registers itself and portals `<div style={{ order: index }} hidden={collapsed && id !== topId}>` around its children, where `index` is its position in `items`. In `Island.tsx` change the container from `flex-col-reverse` to `flex-col` (the list is now explicit, top first) and delete the `[&>*:not(:last-child)]:hidden` selector and the reversed-order comment; `hiddenCount = items.length - 1` stays. The toggle stays below the list.
- [ ] **Step 4:** Add `ISLAND_PRIORITY` to `shared/config`. Pass `priority={ISLAND_PRIORITY.changes}` and `draggable={false}` in `ChapterReorganizePage`.
- [ ] **Step 5:** Run the gate. Manual: Reorganize page still shows its bar, collapse toggle unaffected.

## Task 1b: Drag to reorder

**Files:** Modify `src/widgets/island/ui/IslandItem.tsx`, `src/widgets/island/ui/Island.tsx`, `package.json` and `pnpm-lock.yaml` (dependency approved in Decision 7), `src/shared/i18n/en.ts`, `ru.ts` (keys `island.dragHandle` with `{{title}}`, `island.movedTo` with `{{position}}`).

**Interfaces:** Consumes `items`, `move`, `collapsed` from the island context. Items stay unaware: the handle is rendered by the island's wrapper, not by the item.

- [ ] **Step 1:** Add the sortable dependency. Wrap the expanded list in a sortable context over the draggable ids only; pinned items are rendered outside it.
- [ ] **Step 2:** In the item wrapper render a grip handle (icon-only `icon-xs`, `aria-label`, tooltip) only when the island is expanded, the item is draggable, and there are at least two draggable items. Pointer, touch and keyboard sensors on; dropping calls `move(id, newIndex)`. Announce the new position via the library's live region text (`island.movedTo`).
- [ ] **Step 3:** Collapsing the island ends any drag. When the dragged item unmounts, cancel without error.
- [ ] **Step 4:** Gate. Manual: with player and a second draggable item, drag the lower one to the top and it becomes the displayed item when collapsed; the Reorganize item cannot be moved and nothing can be dropped above it; keyboard move works; works on touch width (375).

## Task 2: Player model (pure logic)

**Files:** Create `src/features/audio-player/model/queue.ts`, `saved-playback.ts`, `speeds.ts`.

**Interfaces:**

- Produces (`queue.ts`):
  - `type QueueEntry = { chapterId: string; position: number; title: string }`
  - `getQueue(chapters: ChapterSummaryResponseDto[]): QueueEntry[]`: chapters whose `audio?.status === 'READY'`, sorted by `position`.
  - `getNeighbors(queue: QueueEntry[], chapterId: string): { previous: QueueEntry | null; next: QueueEntry | null }`
  - `resolveStart(queue: QueueEntry[], saved: PersistedBook | null): { entry: QueueEntry; position: number } | null`: the saved chapter and position if it is still in the queue, else the first entry at 0, else `null` for an empty queue.
- Produces (`saved-playback.ts`):
  - `bookStateSchema` (Zod): `{ chapterId: string, position: number >= 0, speed: one of SPEEDS }`; `type PersistedBook = z.infer<typeof bookStateSchema>`
  - `loadBookState(userId: string, bookId: string): PersistedBook | null` (invalid JSON or shape returns `null`), `saveBookState(userId: string, bookId: string, state: PersistedBook): void`, `clearBookState(userId: string, bookId: string): void`
  - `loadActiveBook(userId: string): string | null`, `saveActiveBook(userId: string, bookId: string): void`, `clearActiveBook(userId: string): void`
  - `type LastBook = { bookId: string; title: string }` (Zod schema `lastBookSchema`); `loadLastBook(userId: string): LastBook | null`, `saveLastBook(userId: string, last: LastBook): void`, `clearLastBook(userId: string): void`
  - `clearAllPlayerState(userId: string): void`: removes every key above for that user.
  - Every storage access is in try/catch.
- Produces (`speeds.ts`): `SPEEDS = [1, 1.25, 1.5, 2, 0.75] as const`, `nextSpeed(speed: number): number` (unknown value returns `1`).

- [ ] **Step 1:** Implement the three files to the signatures above. Edge cases to hold: empty queue gives `null`; bad JSON or wrong shape gives `null`; unknown speed gives `1`.
- [ ] **Step 2:** Gate.

## Task 3: Player provider and `usePlayer`

**Files:** Create `src/features/audio-player/model/PlayerProvider.tsx`, `player-context.ts`, `src/features/audio-player/index.ts`.

**Interfaces:**

- Consumes: Task 2 model; `booksControllerGetBookOptions`, `booksControllerGetChapterAudioAccessOptions` (same query key and `staleTime: 14 * 60 * 1_000` as `ChapterRow`, so the cache is shared), `useCurrentUser`, `toast`.
- Produces `usePlayer(): PlayerApi` where
  `PlayerApi = { activeBookId: string | null; activeChapterId: string | null; view: PlayerView | null; playBook(bookId: string): void; playChapter(bookId: string, chapterId: string): void; toggle(): void; next(): void; previous(): void; seek(seconds: number): void; cycleSpeed(): void; close(): void }` and
  `PlayerView = { bookTitle: string; hasCover: boolean; chapter: QueueEntry; isPlaying: boolean; currentTime: number; duration: number; speed: number; downloadUrl: string | null; errorCode: string | null; hasPrevious: boolean; hasNext: boolean }`.
  Also exports `PlayerProvider`, `clearAllPlayerState` from the slice's `index.ts`.

- [ ] **Step 1:** `PlayerProvider` renders its children plus one hidden `<audio preload="metadata">` (outside any island item, so collapsing never unmounts it). State: `activeBookId` (initialised from `loadActiveBook(userId)`; when set it is restored paused and no toast is shown), `activeChapterId`, `isPlaying/currentTime/duration`, `speed`.
- [ ] **Step 2:** The queue is derived, not stored: `useQuery(booksControllerGetBookOptions({ path: { bookId } }))` while a book is active; `queue = getQueue(data.chapters)`.
- [ ] **Step 3: `playBook(bookId)`.** Same book already active: behave like `toggle()`. Otherwise set the active book (`saveActiveBook`), request autoplay, and once its book query resolves pick the start with `resolveStart(queue, loadBookState(userId, bookId))`. Empty queue: `close()` and `toast` with `player.noAudio`.
- [ ] **Step 4: `playChapter(bookId, chapterId)`.** Same chapter already current: `toggle()`. Otherwise set book and chapter, position 0, `saveBookState` immediately (this overwrites the previous last chapter), `saveActiveBook`, request autoplay. Another book replaces the queue; the old book's saved state stays.
- [ ] **Step 5:** Source: access query for the current chapter; set `audio.src = playbackUrl` when it changes; on `loadedmetadata` apply the start position and `playbackRate = speed`; call `play()` only if the autoplay flag is set. Prefetch the next entry's access query once the current one has played for 1 second.
- [ ] **Step 6:** `ended`: go to `next` with autoplay and save; with no next, pause, set position 0, keep the player open. `previous()`: restart the chapter if `currentTime > 3`, otherwise go to `previous` (restart if none). `error` event: refetch the access query once, then skip to `next`; with nothing to skip to, set `errorCode` and pause.
- [ ] **Step 7:** Reconcile on every book-query result: error (403/404) means `close()` and `clearBookState`; empty queue means `close()`; current chapter left the queue means `resolveStart(queue, null)`, paused.
- [ ] **Step 8:** Persist with `saveBookState`: at most every 5 s on `timeupdate`, and immediately on pause, chapter change, speed change and `pagehide`. `close()` saves once, then pauses, removes `src`, calls `clearActiveBook` and sets `activeBookId` to `null`; it never calls `clearBookState`.
- [ ] **Step 9: Last book.** Whenever the active book's query resolves, `saveLastBook(userId, { bookId, title })`. `close()` never clears it. A 403/404 or no-audio close (Steps 3, 7) also calls `clearLastBook` when it is that book.
- [ ] **Step 10: Resume toast.** One effect on provider mount, after `userId` is known: if `loadActiveBook(userId)` is `null`, read `loadLastBook(userId)` and `loadBookState(userId, last.bookId)`; if both exist, call `toast.add({ id: 'player-resume', type: 'info', title: t('player.resumeTitle'), description: t('player.resumeDescription', { title: last.title }), timeout: 15_000, actionProps: { children: t('player.resumeAction'), onClick: () => playBook(last.bookId) } })`. If `active` is set or either read fails, do nothing.
- [ ] **Step 11:** Gate. Engine behavior is verified in a browser (Task 8).

## Task 4: Player item UI

**Files:**

- Create: `src/features/audio-player/ui/PlayerItem.tsx`
- Modify: `src/shared/i18n/en.ts`, `src/shared/i18n/ru.ts` (keys `player.region`, `playing`, `paused`, `previousChapter`, `nextChapter`, `play`, `pause`, `speed` with `{{speed}}`, `download`, `close`, `seek`, `chapterLabel` with `{{number}}`, `noAudio`, `playBook`, `pauseBook`, `resumeTitle`, `resumeDescription` with `{{title}}`, `resumeAction`)

**Interfaces:**

- Consumes: `usePlayer()` and `PlayerView`; book cover via `booksControllerGetBookCoverAccessOptions` like `BookCoverTile`.
- Produces: `PlayerItem(): ReactElement | null` (null when `view` is null), exported from the slice. It renders only the player row; priority and portaling are the app layer's job.

- [ ] **Step 1:** Build the board's row (`role="region"`, `aria-label={t('player.region')}`): 36×48 cover (placeholder box when `!hasCover`), eyebrow Playing/Paused + "Book title · Ch. N" (truncated), `elapsed / duration`, 4px seek track with a 10px square thumb driven by the `Slider` primitive, first try recoloring it for the dark island via className; if className cannot reach the track or thumb, keep the same slider colors as the chapter audio player, chapter title in serif 13px, then buttons: previous, play/pause (filled, inverse colors as in `ChangesItem`'s Save), next, speed (text button showing `1×`…), download (`<a href={downloadUrl}>`, hidden while `null`), a 1px divider, close. Previous/next disabled by `hasPrevious/hasNext`. All icon buttons carry `aria-label` and `title`.
- [ ] **Step 2: Responsive.** At `sm` and up: the board's single row. Below `sm`: row 1 cover, text block, close; row 2 seek with times; row 3 prev, play/pause, next, speed, download spread with `justify-between`. Use `flex-wrap`, not a second component. Show `errorCode` as a one-line localized message in place of the chapter title.
- [ ] **Step 3:** Gate. Manual: renders at 375, 768, 1280 in light and dark (same tokens as `ChangesItem`).

## Task 5: App-level mounting

**Files:**

- Modify: `src/app/routes/_authenticated.tsx` (holds the small `PlayerDock` composition component, so no new app folder), `src/widgets/authorized-sidebar/ui/AuthorizedSidebar.tsx` (`handleLogout`)

**Interfaces:** Consumes `PlayerProvider`, `PlayerItem`, `usePlayer`, `clearAllPlayerState` from `@/features/audio-player`; `IslandItem` from `@/widgets/island`; `ISLAND_PRIORITY` from `@/shared/config`; `useCurrentUser`.

- [ ] **Step 1:** `PlayerDock` renders `<IslandItem id="player" priority={ISLAND_PRIORITY.player}><PlayerItem /></IslandItem>` only while `usePlayer().view` is non-null, so closing the player drops the item (and the island hides itself when it was the last item).
- [ ] **Step 2:** In the authenticated layout, wrap the tree in `<PlayerProvider>` inside `IslandProvider`, and render `<PlayerDock />` next to `<Island />`. Never inside a page.
- [ ] **Step 3:** In `handleLogout`, call `clearAllPlayerState(userId)` before navigating.
- [ ] **Step 4:** Gate. Manual: navigate library, book, models, home with audio playing; it never restarts.

## Task 6: Chapter rows (same look, shared player)

**Files:** Modify `src/pages/book/ui/ChapterRow.tsx` (`ChapterAudioPlayer` and the module-level `activeAudio`).

**Interfaces:** Consumes `usePlayer()` (`playChapter`, `toggle`, `seek`, `activeChapterId`, `view`).

- [ ] **Step 1:** Visuals stay as they are. The row is "current" when `activeChapterId === chapter.id`. The play button calls `playChapter(bookId, chapter.id)` (it toggles when already current) and shows the pause icon only when current and `view.isPlaying`.
- [ ] **Step 2:** When current, the row's elapsed time, duration and seek bar come from `view` (`currentTime`, `duration`) and the slider calls `seek`. When not current, show the idle view (voice name and duration). The row keeps its own hidden `<audio preload="metadata">` that is never played, only to read the idle duration.
- [ ] **Step 3:** Delete the row's `onPlay`/`onPause`/`onTimeUpdate`/`onEnded` handlers, its playing state and the `activeAudio` global.
- [ ] **Step 4:** Gate. Manual: press play on chapter 3 of a book with 5 ready chapters; the island player appears with chapter 3 and the row shows live time and seek; pressing play on another book's chapter replaces it.

## Task 7: Book page play button

**Files:**

- Create: `src/features/audio-player/ui/PlayBookButton.tsx`
- Modify: `src/features/audio-player/index.ts`, `src/pages/book/ui/BookPage.tsx` (book details, next to the status badges or actions)

**Interfaces:**

- Produces: `PlayBookButton({ bookId: string; disabled?: boolean })`: a labelled `Button` calling `playBook(bookId)`. Shows pause (label `player.pauseBook`) when this book is active and playing, otherwise play (label `player.playBook`).

- [ ] **Step 1:** Implement `PlayBookButton`; the book page passes `disabled` while `parseStatus !== 'READY'` or no chapter has ready audio.
- [ ] **Step 2:** Put it in the book page top details.
- [ ] **Step 3:** Gate. Manual: with saved state, book play resumes that chapter and time; without it, starts at the first ready chapter; press X, open the book page again, press the button, and the player returns at the last position; press a chapter row play and that chapter replaces the saved one; a book with no audio shows the `player.noAudio` toast and no player.

## Task 8: Docs and verification

**Files:** Modify `docs/features/product-behavior.md` (player behavior), `docs/architecture/ui-primitives.md` (Island row: priority order, player item), `docs/architecture/frontend-architecture.md` (the `features/audio-player` slice and the app-layer composition), `docs/history.md`; this plan's status.

- [ ] **Step 1:** Document: queue = the book's ready chapters in order, derived live; the three storage keys, the book-play vs chapter-play rules (Decision 4) and the resume toast rule (Decision 5); X keeps per-book state; restore on reload is paused and only for the open book; island order (Reorganize changes pinned, player and generation draggable) and the drag rules; the collapsed-island consequence from Review Focus; single-tab limitation (a second tab plays on its own and overwrites storage).
- [ ] **Step 2: Manual checklist** (`pnpm dev`, then stop it): play, pause, seek, speed cycle, next/previous, auto-advance at the end, last chapter ends paused; reload mid-chapter shows the paused player at the saved time; press X, reload, no player and the resume toast shows; Continue loads the last book and plays from the saved spot; reload while the player is open shows the player paused and no toast; first ever visit (nothing played) shows no toast; press X, press book play, the player returns at the saved spot; two books keep separate positions; delete a chapter's audio from another tab and the player moves on; wait past 15 minutes paused, play still works; open Reorganize, change something, the changes item is on top and the player is under "1 more"; logout then login shows no player and no saved state; checks at 375, 768, 1280 with no horizontal overflow.
- [ ] **Step 3:** Add the history entry (short unique title, no hash); run the gate and confirm no dev server is running.

## Self-review

- Coverage: app-wide persistent player (Tasks 3, 5), whole book as queue with prev/next (2, 3), another audio replaces it (3), per-book state kept after X (3, Decision 3), book play resumes and chapter play overwrites (3, 7), reload restores only the open book (3), book page play button (7), resume toast (Decision 5, Task 3 Step 10), chapter rows unchanged (6), island order with pinned Reorganize item and draggable player/generation items (1, 1b, Decision 6), responsive layout (4). Generation items are out of scope by design.
- Names checked across tasks: `ISLAND_PRIORITY` (`@/shared/config`), `insertEntry`, `moveEntry`, `usePlayer`, `PlayerView`, `playBook`, `playChapter`, `clearAllPlayerState`, `resolveStart`, `SPEEDS`.
- Out of scope, noted for later: Media Session lock-screen controls, cross-tab sync, sleep timer.
