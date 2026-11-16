# Product behavior to preserve

Frontend behaviors an agent must not break. The full product catalogue is in
the [backend feature docs](../../../narrator-general-api/docs/features/README.md).

- Private routes are guarded once by `_authenticated`; public login/register
  routes redirect signed-in users away.
- The book page has two modes on the same route, switched by a button. **Listen** (default, everyone): chapter info, the audio player and download; no selection, batch bar or per-row menus. **Narrate** (owner only, the **Narrate** button in the chapter section header, **Done** returns): the controls below, with no player (rows show only "Audio ready · voice" or the generation state). The mode is not remembered across visits; the book Play button shows only in Listen.
- The book page's Narrate mode owns chapter selection (chapters tagged not narrated have no checkbox), batch audio controls (selecting chapters with audio turns Generate into a confirmed Regenerate), audio playback,
  declared EPUB language, and the recorded voice label. An owner-only
  **Reorganize chapters** link opens `/library/:bookId/reorganize`
  (`ChapterReorganizePage`): a read-only chapter reader (it shows EPUB images where they stood; the backend's `[[img_<id>]]` markers in the text are split out by `splitChapterText`, never shown as text, and a marker with no image shows nothing) plus role tags, a
  per-chapter narration toggle, chapter title editing and merging of adjacent chapters. Edits are
  a client-side draft until **Save changes**; saving a merge of chapters that
  have audio, or marking a narrated chapter with audio as not narrated, asks for
  confirmation (the island warns too) and deletes that audio; the server
  requires `discardAudio` for the latter. Each chapter is a flat row: the role shows in
  the meta line for non-main chapters and excluded chapters say **Not narrated**
  (tooltip) in the audio column unless they still have audio, which shows as
  usual; those chapters have no select checkbox. Audio
  download and delete live in the row's **More actions** menu. The **Select narrated chapters** toolbar control and
  the parser-suggestion pill stay commented out; see
  [`chapter-tags-and-narrated-selector-hidden.md`](../issues/chapter-tags-and-narrated-selector-hidden.md). It clears
  cached signed audio access after delete/requeue so the player does not
  retain a removed object URL. Each chapter's recorded voice label
  (`chapter.audio.voiceName`) is resolved server-side against the current
  voice catalogue, not joined client-side. A `TtsSelector` dropdown next to
  the batch Generate button shows the currently selected model as a
  non-interactive label and lets the user pick a Fish voice (for Silero, one of its listed voices) without leaving
  the page; it writes through the same voice-selection mutation/query as the
  Models page, so the two stay in sync. Switching the _model_ itself only
  happens on the Models page — the dropdown links there instead when no
  model is selected yet. Generate (both batch and the per-chapter retry
  action) is disabled, with an inline explanation, until a model is selected
  and, if that model is Fish, a voice is selected too — the backend has no
  fallback for either and rejects an incomplete selection; an archived Fish
  voice (its `.env` default removed) has its selection cleared server-side so
  this state can't go stale. Deleting a book (library card or book page) asks
  for confirmation, works in any parse/audio state, leaves the book page
  first, then drops every query for that book and refreshes the library
  list. The Models page owns Fish-key setup plus TTS-model and Fish
  default/custom voice selection. Default voices are deployment supplied and
  not removable; custom voices belong to the signed-in user. Fish voice
  controls are inactive unless a Fish model is selected, and archived/
  unavailable voices are hidden from both the voice picker and the voice
  list (unless currently selected, so the user can see what needs
  replacing). Local models: Silero TTS and Qwen3-TTS 0.6B (ru/en) are the enabled ones and appear as cards on the Models page once the backend lists it. `TtsSelector` lists a local model's fixed voices for the book's language (from `GET /tts/models`); the pick is stored per browser (`widgets/chapter-narration/model/local-voice.ts`) and sent as `voiceId` on generate. It falls back to a disabled name label when the model lists no voice for the book's language. Piper, Kokoro-82M and Chatterbox Turbo are removed or disabled. See [`local-tts-models-disabled.md`](../issues/local-tts-models-disabled.md), which also records how local voice selection works.
- A book's owner (`book.book.isOwner`) can make it public (confirmed
  `AlertDialog`, same pattern as delete) or private again from the book page;
  a `Public` badge shows next to `Ready`/`EPUB` whenever it's public. Every
  owner-only control — selection, the batch toolbar, cover editing, delete
  book, per-chapter delete-audio (also for failed or cancelled audio, next to Continue) and queue/retry — is hidden entirely for a
  non-owner viewing a public book; they keep the chapter list, ready audio's
  player, and the download button, plus **Add to library** (a saved
  reference, not a copy — the **My library** tab's **My books / Public /
  All** pills filter by it, reusing `book.publicBadge` as the pill label and
  the added book's card badge, not a library-specific "Saved"/"Added" label)
  and **Make a copy** (an independent, fully owned book). `/library`'s
  **Community** tab lists every public book, searchable by title.
- `/library`'s **Collections** tab lists owned and saved collections plus ghosts, with a **Create collection** button at the top right (the toolbar row, like Add book). Each collection is a stack of 3D books seen from above (`pages/library/ui/CollectionStacks.tsx`: one shared canvas over the DOM cards, up to 5 covers from the list's `coverUrls`, the first book on top, each turned and shifted a little so the stack is not flush; hovering the card fans them out so more covers show; a collection with no covers is one plain book with its title). The Community tab's collections still use the old cover cards (`CollectionCard`),
  and Community has a **Books / Collections** switch. A collection page lives at
  `/library/collections/$collectionId`: one viewport tall with no page scroll, two sections split 1:2 like Home (left: the visibility badge, book count and the owner's **Make public** button at its top right, the title as an inline field, the books as a flush 3D pile seen from above and turned a little, first book on top, spines with titles facing you, thickness from each book's `wordCount`, stacks of up to 6 books with the next books starting another stack behind (up to 3 stacks, 18 books), seen from a lower angle at rest and rising to a higher one while hovered (`CollectionBookPile`), and the description as a text block under it; stacked above the list below `lg`; right holds the book cards with covers from each entry's `coverUrl`, scrolling inside). The owner reorders books by dragging the whole card (`@dnd-kit`; touch needs a short press; a plain grip icon at the card's far left is the hint; the focused card is the keyboard handle). Everything the owner changes (title, description, **Make public** / **Make private** at the top right of the left section, **Add books** at the right end of the button row, removing a book, the order) is a draft shown at once and saved only from the island's **Save changes** item (`ChangesItem`, shared with Reorganize: change count, summary, a warning when saving publishes the owner's private books, a saving step, **Discard** with a confirmation). Saving sends it in steps (details, going private first, removals, additions, order, going public last); after a failure what was saved stops counting and the rest stays. Going public is blocked while a book it would publish is still processing. The drafts are lost if you leave first. A non-owner sees the title and description as plain text. A ghost is a saved or collected item whose owner made it private. It shows
  its title and a remove action, never a cover or link, and it returns on its
  own if made public again. `features/add-to-collection` is shared by the book
  page and collection page.
- The book detail query currently polls only while parsing or audio work is
  active. This is an intentional interim choice tracked in
  [`book-audio-progress-polling.md`](../issues/book-audio-progress-polling.md).
- Every visible string, including validation, toasts, aria labels, loading, and
  error text, needs English and Russian i18next values. Theme and locale are
  persistent client preferences.
- **Audio player** (`features/audio-player`, mounted once in the authenticated
  layout, so navigation never interrupts it). One hidden `<audio>`; the queue
  is the book's chapters with `READY` audio in order, derived live, so merging
  or deleting audio changes it without a crash (the player moves to the first
  ready chapter, paused, or closes when none remain). Saved state is per book
  (`narrator.player.v1:<user>:<book>` = chapter, position, speed); the X button
  closes the player but keeps it. Starting rules: **book Play** (book page)
  resumes the saved chapter and position, else the first ready chapter at 0:00;
  **chapter Play** (row) starts that chapter at 0:00 and overwrites the saved
  state. A reload restores the open book paused (`narrator.player.active:<user>`),
  never autoplaying. If no player was open and a last book (`...last:<user>`)
  has saved state, a toast `player-resume` offers "Continue". A book that
  becomes unreadable (403/404) closes the player and clears its state. Logout
  removes every `narrator.player.*:<user>*` key. Limits: single tab (a second
  tab plays on its own and overwrites storage); while Reorganize shows its
  pinned item a collapsed island hides the player until "N more" is opened.
  Any later action that changes audio (regenerate, delete, merge, tag/voice
  change) must decide what the player does; see the docs README rule.
- **Home** (`/home`): two full-width cards side by side (no visible page title; an `sr-only` h1 remains) that fill the whole viewport height and scroll inside when their content overflows (stacked and page-scrolling below `lg`, the second widest; on phones the view switch sits under the card text, the picked book's 3D showcase is scaled to fit the free space with equal padding, short or tall). 1 Choose a book: a searchable **Book** picker (`shared/ui/combobox`: type to filter by title; every owned book, loaded in pages of 50 until the last) that shows **Not selected** until a book is picked (the default); its clear button goes back to that. While nothing is selected, an "&" divider and the dashed drop card (`shared/ui/add-card`, as in the library) show; click or drop opens the upload dialog (`features/upload-book`), which selects the uploaded book. Once a book is selected, a big 3D book (`pages/home/ui/BookShowcase.tsx`, the same `entities/book` `Book3D` as the library shelf, turns on hover) fills the card and its title and author, then language, chapters and size in one line sit at the bottom (a status chip shows on the book until parsed), replacing the drop card. 2 Tidy and narrate has a top-right **Tidy** / **Narrate** view switch: Tidy is the reorganize page's editor (`widgets/chapter-editor`), Narrate is the book page's chapter selection, voice and Generate (`widgets/chapter-narration`). Both stay mounted so unsaved reorganize edits survive a switch. The card keeps its normal subtitle and stays dimmed with the hint centered in its body until a book is selected and has parsed chapters, and the book is polled while parsing or generating.
- **Library shelf**: the My library tab draws books as 3D books on shelves
  (`pages/library/ui/LibraryShelf.tsx` over `entities/book`'s lazy `Book3D`, react-three-fiber): the cover
  is the front face, word count (`wordCount` on each list item) sets the thickness; the cover link (`coverUrl`) also comes with the list, so the shelf makes no per-book requests, hover turns a book clockwise to show its cover and a
  click opens it. The book's front is drawn on a canvas (`entities/book/model/book-front.ts`): the
  book is as tall as its cover's proportions make it (150-250 px for a 128 px width; a book stays hidden until its cover has loaded or failed, so it never resizes; a book without a cover keeps a random 190-230 px) and the cover art fills the front (the old tinted band with author and title is switched off
  by `FRONT_BAND` in that file; a book without a cover still shows it as its whole face, except while it is still parsing: then it is a plain gray book).
  The spine takes the colour of the cover's left edge row by row (no gradient), with the title in dark ink on a light spine and paper-white on a dark one with the title
  written down it, and the spine bulges out in a rounded arc; thin cover boards overhang the inset pages by 2 px and the spine is as thick as they are, with the pages' left edge bent to match; a book is 30-52 px thick. One shelf holds the books
  the filter shows; the **Add book** button at the right end of the toolbar row opens the
  upload dialog (no drop card on the shelf); a title search box before the filters (one toolbar row, `sm` control height) sends `search` to `GET /books` (debounced; the header and counts stay unfiltered; no matches shows its own empty state). The list loads 20 books at a time; **Load more** under the shelf fetches the next 20 (the filter counts and the header count are whole-library totals from the backend's `counts`). Play and the "…" or
  remove button are DOM buttons at the top right corner of the book: they fade in
  once a hovered book has finished turning to face you and are hidden otherwise
  (always shown on touch); a status chip shows top left until the book is parsed, and a **Private** badge shows bottom left with the buttons when the book is private. Cells are laid
  out in pixels shared by canvas and DOM, so the shelf recomputes columns on
  resize. Limits: the WebGL covers need the cover host's CORS headers, and the
  old cover-card grid (`LibraryBooks.tsx`) is kept but no longer rendered.
- **Cover Play**: library book covers show a Play button (left of the "…" menu) when the book is parsed and `hasReadyAudio` (from the book list). It is the book page's button as an icon: Play, Pause while it plays, or Continue when this device has saved progress; the player loads the book itself on click. Hover-revealed like the menu, always visible on touch. The flag comes from the list query, so it updates on the next refetch.
- **Island order**: Reorganize's changes item is pinned first (bottom slot)
  (`draggable={false}`); the player and the generation item are draggable
  among themselves (a white handle on a dark scrim over the item's cover, shown on hover and
  always on touch, plus keyboard; only when expanded with two or more draggable
  items). Defaults come from `ISLAND_PRIORITY` in
  `shared/config`; order is not saved across reloads.
- **Island position**: the island sticks to the bottom of the screen by default.
  Drag the grip strip on its right edge (or press Up/Down on it) and it snaps to
  the top (just under the header) or the bottom, by the half of the screen it was
  dropped in. At the top the first item is the highest and the rest, plus the
  "N more" toggle, grow downward. The choice is saved per device in
  `localStorage` (`narrator.island.placement`).
- **Generation item**: on every page, while the user's own books have chapters
  queued or processing (`GET /books/audio/active`, polled every 2 s only while
  something runs), the island shows one row per book (stage, parts done, bar,
  "N more chapters") with **Stop** for that book. With several books it shows a
  summary (stacked covers, overall progress, "Now: …"), a toggle for the
  per-book queue and **Stop all** (running books only). Stopping a book from the
  island keeps its row with **Continue** (re-queues the stopped chapters) until it
  runs again, or until its **X** removes just that row; this is kept in memory
  only, so a reload or logout drops it. Stops
  made from the book page do not keep a row. Queueing or stopping audio
  invalidates the query so the item appears or updates at once.
