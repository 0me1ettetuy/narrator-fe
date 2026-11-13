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
  have audio asks for confirmation and deletes that audio. Each chapter is a flat row: the role shows in
  the meta line for non-main chapters and excluded chapters say **Not narrated**
  (tooltip) in the audio column; those chapters have no select checkbox. Audio
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
  replacing). Local models: Silero TTS and Qwen3-TTS 0.6B (ru/en) are the enabled ones and appear as cards on the Models page once the backend lists it. `TtsSelector` lists a local model's fixed voices for the book's language (from `GET /tts/models`); the pick is stored per browser (`pages/book/model/local-voice.ts`) and sent as `voiceId` on generate. It falls back to a disabled name label when the model lists no voice for the book's language. Piper, Kokoro-82M and Chatterbox Turbo are removed or disabled. See [`local-tts-models-disabled.md`](../issues/local-tts-models-disabled.md), which also records how local voice selection works.
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
- `/library`'s **Collections** tab lists owned and saved collections plus ghosts,
  and Community has a **Books / Collections** switch. A collection page lives at
  `/library/collections/$collectionId`. Going public lists the owner's private
  books in a warning first, and the toggle is blocked until they're all `READY`.
  A ghost is a saved or collected item whose owner made it private. It shows
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
- **Island order**: Reorganize's changes item is pinned first (bottom slot)
  (`draggable={false}`); the player and the generation item are draggable
  among themselves (a white handle on a dark scrim over the item's cover, shown on hover and
  always on touch, plus keyboard; only when expanded with two or more draggable
  items). Defaults come from `ISLAND_PRIORITY` in
  `shared/config`; order is not saved across reloads.
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
