# Frontend change history

This is the committed history of `narrator-fe`, organized into milestones and
backed by a complete chronological commit index. It records what files and
capabilities actually changed in Git, rather than relying only on commit
subjects.

**Scope:** 26 August–8 November 2026, through Silero TTS.

**Rules.** Newest milestone first; each entry is 1–3 lines (detail belongs in
the owning doc). Add work in "Uncommitted work". When this file passes about
150 lines, move the oldest milestones to `history/milestones-archive.md`.

## Uncommitted work

- Docs tree audit: added `docs/superpowers/README.md` (plans index) and linked
  it and the root `README.md` from `docs/README.md`, so every markdown file is
  reachable from `CLAUDE.md`/`AGENTS.md`.
- Docs audit fixes: the local-voice section of
  `docs/issues/local-tts-models-disabled.md` now records the implemented
  Silero dropdown instead of a deferred TODO; refreshed `book-page-design.md`.
- Docs restructure: `AGENTS.md` is the single instruction file and `CLAUDE.md`
  only imports it; "Product behavior to preserve" moved to
  `docs/features/product-behavior.md`; `docs/README.md` is now a routing table
  with creation, editing and size-budget rules; history split into recent
  entries, a milestones archive and a commit index under `docs/history/`;
  Definition of done added to `AGENTS.md`.

## Milestones

### 8 November — Silero voices on the book page

- `TtsSelector` now lists a local model's voices for the book's language (from
  `GET /tts/models`) as a dropdown instead of a disabled name label. The pick
  is stored per browser and language in `localStorage`
  (`pages/book/model/local-voice.ts`), defaults to the first listed voice, and
  is sent as `voiceId` when generating a chapter or a batch.
- Exported `TtsLocalVoiceResponseDto` from `shared/api`.
- Added a "Keeping docs in sync" rule to `CLAUDE.md` and `AGENTS.md`.
- Updated `CLAUDE.md` and the local-TTS issue records for Silero replacing
  Qwen3-TTS.

### 5 November — book collections

- Added the **Collections** tab on `/library`: owned and saved collections,
  ghost cards for saved collections whose owner made them private, and a
  create dialog. Added the collection page at
  `/library/collections/$collectionId`.
- Community has a **Books / Collections** switch. Public collections can be
  saved, and making a book private shows its ghost card with a remove action
  instead of a cover or link.
- The collection page lets the owner edit, delete, add, reorder, and remove
  books, and change visibility. Going public lists the owner's private books
  in a warning first, and the toggle is blocked until they are all `READY`.
  Non-owners can save a public collection.
- Added `features/add-to-collection`, shared by the book page's **Add to
  collection** and the collection page's **Add books**. Adding a private
  book to a public collection asks to publish it first.
- Added the collections client exports, error codes, and EN/RU translations.
  The generated `routeTree.gen.ts` changed for the new route and is committed,
  although `CLAUDE.md` describes it as ignored and it is tracked in Git.

### 3 November — explicit TTS selection and book deletion

- Added a compact model/voice dropdown next to the book page's **Generate**
  button: Fish Audio first (a nested submenu with model tiers and voices), then
  local models, or a link to the Models page when no Fish key is saved. It
  writes through the same selection mutations as the Models page.
- **Generate** and the per-chapter retry action are disabled, with an inline
  explanation, until a model and (for Fish) a voice are selected, matching the
  backend's removal of its implicit fallbacks. Added EN/RU messages for
  `TTS_MODEL_NOT_SELECTED` and `FISH_VOICE_NOT_SELECTED`.
- Added book deletion as the first `features/` slice (`features/delete-book`),
  used by the library card (an icon beside, not inside, the card link) and the
  book page header. After confirmation it leaves the book page, drops every
  cached query scoped to the book, refreshes the library, and treats an
  already-deleted book as success.

## Older history

- [Milestones archive](history/milestones-archive.md) — milestones before the ones above.
- [Complete commit index](history/commit-index.md) — every committed change, by date and hash.
