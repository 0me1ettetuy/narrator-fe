# Frontend change history

This is the committed history of `narrator-fe`, organized into milestones and
backed by a complete chronological commit index. It records what files and
capabilities actually changed in Git, rather than relying only on commit
subjects.

**Scope:** 26 August–8 November 2026, through Silero TTS.

**Rules.** Newest milestone first; each entry is 1–3 lines (detail belongs in
the owning doc). Add work under "Recent changes" before committing, so the
entry lands in the same commit as the work. Start each entry with a short unique
title, no hashes; find its commit with `git log -S"<title>" -- docs/history.md`
(or `git blame`). When this file passes about
150 lines, move the oldest milestones to `history/milestones-archive.md`.

## Recent changes

- 404 and route-error pages redesigned: left-aligned eyebrow, 56px title, serif text, actions; 404 shows the missing path and signed-in / signed-out buttons, route error has a collapsible technical-details box with copy (localized code + route, never the raw message). Shared `ErrorPageContent` in `shared/ui`.
- Breadcrumbs show the book's title (truncated, from the cached book query) instead of the word "Book" on its sub-pages.
- Island collapse: the newest item is always visible and any others sit behind a "N more" / "Show less" toggle; with a single item there is no toggle and no header strip.
- Island polish: the collapse button no longer shows a filled box while expanded, and the item's icon box uses the cobalt that contrasts with the island surface in each theme.
- Global island: `widgets/island` is a collapsible container fixed to the bottom
  of the authenticated layout. Pages add stacked items with `<IslandItem id>`
  (portaled into the island, so the page keeps its state and handlers); an item
  leaves when its page unmounts or stops rendering it. Reorganize's unsaved /
  saving bar is the first item (`ChangesItem`); a player and generation status
  will be more items. A new item opens a collapsed island.
- Models page, third design: model cards are flat (icon box that turns blue when
  selected, 14px name, mono id, one-line note) with a footer holding a Ready /
  Selected badge and Select; unavailable models show a red Unavailable badge and
  the reason. The Fish voices card always shows the default voice and its note,
  with a footer "N voices" badge and a Change voice / Done button that reveals
  the voice list and add form.
- Reorganize changes island: Save and Discard left the page header for a
  floating bar at the bottom (`ChangesIsland.tsx`) with three states from the
  design: unsaved changes with a summary ("1 renamed · 1 merged · ..."), the same
  with a red "Saving deletes audio for N chapters" line, and saving with the
  current step; a "Changes saved" toast follows. The island appears only while
  there are changes. Unlike the design's warning board, Discard stays enabled.
- Models page, second design: sections are stacked (title, one-line intro and
  Connected badge on one row) instead of two columns, and the "New audio uses"
  strip is gone. Model cards have a 72px band (cobalt when in use, grey
  otherwise; dashed and muted when unavailable), a serif title, a status dot and
  Select / "Used for new audio". Fish voices are a collapsed "Default voice"
  row that opens to the radio list and add-voice form; Shared/Custom are plain
  text. Content is 1040px wide. Hardware tags (CPU/GPU) are not shown: the API
  has no such field.
- Reorganize header no longer jumps: Save/Discard stay on the title row from the `sm` breakpoint up, and the intro text wraps instead of the buttons.
- The Narrate switch in the Reorganize reader has a tooltip with the same text as the Not narrated toolbar button (included / skipped when you narrate the whole book).
- The narration switch label is just "Narrate" ("Озвучивать") in the reader and the merge dialog.
- Reorganize reader alignment: the title input and section type select share a bottom edge (the select's wrapper was an inline block that added a text-baseline gap under it).
- Reorganize reader: the narration switch (small) and Undo merge moved into the reader's header bar next to previous/next, so the title and section type are the only form row.
- Reorganize reader: the section type select sits to the right of the chapter title input (wraps below on narrow panels); the narration switch and Undo merge are on the row under them.
- Reorganize fits one viewport: the page is `100svh` minus the app header, the title and toolbar stay put, and only the chapter list and the reader scroll inside their own panels.
- Alert dialog width: back to 384px (the design's 320px is too tight for labels like "Keep book" / "Delete book").
- Reorganize toolbar: the bulk-edit bar spans the full width above the chapter list and reader, with select all and the count on the left and section type, Not narrated and Merge on the right.
- Reorganize header: Discard and Save stay right-aligned when the header wraps below the title.
- Book page polish: the cover's top accent is 3px and two-tone (a darker 30%
  segment, then the colour inferred from the cover by `useCoverColor`, brand
  blue until it loads); not-narrated chapter rows have no checkbox slot, so
  their text starts at the left edge.
- Reorganize declutter: "No changes" and Discard only show once there are
  unsaved changes (Save stays, disabled until then), and the section type /
  Not narrated / Merge controls appear only while chapters are selected, so an
  idle toolbar is just the select-all row. The chapter audio menu is wide
  enough to keep its labels on one line.
- Page headers: Library, Home and Models share `shared/ui/page-header.tsx`
  (56px title, muted meta line on its baseline, serif intro, optional actions).
  Home is titled "Home" with the book count; Models shows "N models · M ready"
  and the "keeps the voice it was made with" note moved into its intro.
- Dialogs redesign: dialogs and alert dialogs use the popover surface with a
  hairline ring, the close button sits 12px from the corner, and alert dialogs
  stack an icon box (red outline for deletes) above the title at 320px. Delete
  book/audio/collection, regenerate, make public and publish-on-add got icons;
  Create collection has character counters and a private hint; Add to
  collection lists collections as rows (title, "N books · Private") with a Done
  button; Change cover shows a preview with Choose / Remove; Add books has a
  drag-and-drop zone, a file list and a total. Not built: the design's
  checkbox toggle in Add to collection, "Use EPUB cover", upload percent bars
  and the toast restyle.
- Models page redesign: a "New audio uses" summary strip, then Fish Audio and
  Local models as two-column sections (provider info on the left, model cards
  on the right). Model cards drop the selected badge for an ink ring plus "In
  use for new audio"; the Fish key form and the voices card follow the design
  (voices are an always-open radio list with a Shared/Custom badge, remove icon
  and an add-voice row). `radio-group` is restyled square with a cobalt fill.
  Model tags (Cloud, GPU, ...) from the design are not shown: the API has no
  such field.
- Reorganize page redesign: chapter list on the left (sticky toolbar with select
  all, section type, Not narrated and Merge), sticky reader on the right with
  title, section type, narration switch and previous/next chapter. The unsaved
  changes count, Discard and Save moved to the page header; Discard now asks
  first; changed chapters get a cobalt dot; the merge dialog shows the audio
  warning as an alert.
- Chapter list rows: the book page chapters are now flat divided rows from the
  design (`ChapterRow.tsx`, split out of `BookPage.tsx`): checkbox, serif title
  with "Chapter N · words · role" meta, and a 320px audio column (play + voice +
  length, or status icon + progress + stop/continue, or "No audio" / "Not
  narrated"). The chapter toolbar is a flat bar with an ink bottom border and
  plain "N selected" text; Reorganize is a ghost button. Delete audio and
  download moved into a "More actions" menu per row.
- Sidebar logo toggle: the raven mark replaces the collapse button in the sidebar
  header; hovering the header (or keyboard-focusing the button) swaps it for the button, expanded or
  collapsed. Without hover (touch) the button is always shown. The wordmark is
  serif like the public header.
- Reuse rules: `AGENTS.md` Guardrails now say to reuse components before
  building, share markup that two slices need (entities/features/shared), balance
  KISS/DRY/SOLID, and never invent sizes; the delivery checklist has a matching
  search step.
- Shared book tile: the cover-led tile moved to `entities/book` (`BookCoverTile`,
  plus the cover-colour hook); the library keeps its delete/remove actions and
  meta line around it, and Home's **Recent books** uses the same tile instead of
  a copy.
- Home page from the design: header (**Welcome back**, book count, **Add book**),
  a **Narrator voice** card (selected model, **Change model**), and **Recent
  books** (first four, cover tiles). New users see the empty state with an add
  button and three steps. Not built, no API for them: **Continue listening** and
  **Generating now** cards.
- Public pages no longer scroll: the public layout is a full-height column and
  Hero, About, Sign in and Register take the remaining height (`flex-1`) instead
  of a viewport-minus-header calc that overflowed by the header's border.
- Hero and About fill the screen: the page is at least viewport height and the
  picture row grows, so the steps (Hero) and the create-account row (About)
  sit at the bottom instead of leaving an empty band.
- Password show/hide: `shared/ui/password-input.tsx` wraps `Input` with an eye
  button (32px ghost icon, inside the field); the sign-in password and both
  register password fields use it.
- Public header from the design: sticky 56px bar with the logo, ghost **About** /
  **Sign in** links (active one filled), solid **Create account**, then a theme
  toggle and a language toggle (same actions as the sidebar settings). Signed-in
  visitors see their avatar and email instead of the sign-in links.
- Raven logo: the design's pixel raven mark is `shared/ui/logo.tsx` (`LogoMark`,
  `currentColor`); the public header shows it with a serif **Narrator**
  wordmark, the sign-in/register picture panel tag uses it in cobalt, and
  `public/favicon.svg` is the mark (ink in light, paper in dark) instead of the
  Vite default.
- Public pages from the design: **Hero** (eyebrow, 46px headline with a cobalt
  italic accent, serif intro, cormorant picture, four numbered steps), **About**
  (headline, vinyl picture, Upload/Generate/Share points, create-account row),
  and **Sign in / Register** as a split layout: picture panel with a Poe quote
  (`widgets/auth-aside`, hidden below `lg`) beside a plain form. The public
  header is restyled separately (see Public header).
- Models page design: page header like the library (title, serif intro), 24px
  section headings, model cards with a 40px icon box, outline **Select** button,
  cobalt ring and **Selected** badge on the chosen model, inactive transparent
  card for unavailable ones. Forms and the voice manager are unchanged.
- UI primitives doc: `docs/architecture/ui-primitives.md` lists every primitive's
  sizes, spacing, type and the shared layout recipes, with rules for designs.
- Collection stack card: collection cards are 3:4 like book tiles, with two sheets
  peeking out behind the cover so they read as a set of books; the ink band says
  **Collection · N books**, the visibility chip sits top right, and the description
  is one muted line below.
- Not-narrated chapter alignment: chapter cards with no select checkbox no longer
  reserve its space, so their text starts at the card's left padding. They also
  look inactive: transparent card surface and muted title.
- Reorganize changes bar at the bottom: the toolbar (section type, not narrated,
  merge, discard, save) sits under the reader/list split and sticks to the bottom
  of the viewport. A status text shows the number of unsaved changes (merges,
  renamed chapters, and chapters with a changed role or narration).
- Reorganize page spacing: toolbar, header, select-all and chapter rows share 16px
  side padding; toolbar selects match the 32px buttons; chapter rows put the role
  in the meta line (words · role) with only the **Not narrated** badge on the right.
- Book page owner buttons: the change-cover button is a standard 32px icon button
  at the top right of the cover, shown on cover hover or focus (always on touch);
  the **Book actions** menu is the same size at the top right of the details.
- Chapter panel on shadcn parts: the chapter controls keep the plain Card,
  Field/Checkbox, Badge, Separator, Button, Alert and DropdownMenu primitives
  (restyled by the Paper & ink tokens) with a larger **Chapters** heading, a
  sticky toolbar under the page header, and hint/error as Alerts. The voice
  selector and regenerate dialog are unchanged from before. The select-all label is
  sentence case, not the uppercase field-label style.
- Book details redesign: the book page header follows the design's "Book
  details": 220px 2:3 cover with a cobalt top bar and paper change-cover button,
  author line, serif 46px title, status/format/visibility chips, a four-column
  facts row, and an audio summary (segmented bar of narrated chapters: ready, in
  progress, need attention, plus without-audio and not-narrated counts). Owners
  get the actions in one **Book actions** menu (add to collection, make
  public/private, delete); non-owners keep their inline buttons. `DeleteBookButton`
  and `AddToCollectionDialog` can now be opened from outside (no trigger).
- Library tile actions: the delete button (own books) and remove button (added
  books) are back, top-left on the cover, shown on tile hover or keyboard focus
  and always visible on touch screens; paper square, red fill on hover.
- Create-collection card: the Collections tab starts with the same dashed 3:4 add
  card as My library (`AddCard`, shared; replaces `AddBookCard` and the top-right
  button). The empty state is gone, since the card is the empty state.
- Library filter counts: All / My books / Added show a book count, taken from the
  shared "all" list (so only the books that list returns, up to its page size).
- Sticky header: the breadcrumb header stays at the top while the page scrolls
  (`sticky top-0` with the page background in `AuthorizedHeader`).
- Upload dialog close flash: after a successful upload the form keeps its
  uploading state while the dialog closes, so the button no longer flips to
  "Upload 0 books" during the exit animation.
- Library tab panels render their content only while active, so a tab that is
  still unmounting cannot stack its cards above the next tab's loader. The
  tabs have no flex gap and the spacing sits on that content, so the new tab no
  longer shifts up when the old panel unmounts.
- Cover band colour: library tiles tint the band from the cover's bottom edge
  (`pages/library/model/use-cover-color.ts`, canvas sampling). It needs CORS on
  the cover host; without it the band stays ink.
- Library layout: copied from the design's shell page: page header (title, count,
  intro) and cover-led tiles (4:3 art, ink band with author/title, status chip,
  one meta line); **Add book** is the first tile
  (`AddBookCard`, click or drop EPUBs), filters sit left-aligned under the tabs,
  grids go to 4 columns at xl. Delete/remove moved off the tiles to the book page.
- Collapsed sidebar alignment: the icon rail is 3.5rem and every icon (toggle,
  menu, avatar) keeps the same x position when collapsing, so nothing jumps. The user card keeps its expanded width and is clipped, so its
  text is in place from the first frame of the expand animation, and the footer
  keeps one height so the card does not shift vertically. The theme/language row
  is clipped the same way, so it no longer overflows while opening.
- Noise on covers: library, community and collection cards and the book page
  thumbnail wrap the cover in `noise` (the enlarged dialog image stays clean).
- Noise overlay: a `noise` utility in `app/styles/index.css` adds a film-grain
  layer over a wrapper (not an `<img>`); strength via `--noise-opacity`. Not used
  anywhere yet.
- Remaining used primitives restyled: input-group, sheet and toggle now follow
  the Paper & ink style (collapsible and spinner had nothing to change); the
  unused primitives are tracked in `issues/unrestyled-ui-primitives.md`.
- Paper & ink sweep: square corners across restyled primitives and page call sites,
  outline and ring overrides removed so the global cobalt focus ring shows; the
  two cover and epub dropzone labels drop the small-caps style.
- Feedback restyle: alerts on the paper border with serif descriptions, inverted
  toasts (red for errors), square empty and error states, ruled loading boxes.
- Overlay restyle: tooltips, menus, dialogs and alert dialogs on the paper
  surface; only floating layers get a shadow, dialog overlays drop their blur,
  and menu items are 40px with a secondary highlight.
- Tabs, breadcrumb and sidebar restyle: 44px line tabs with an ink underline,
  uppercase `/`-separated breadcrumbs and square 44px sidebar items; sidebar
  structure and providers unchanged.
- Card, skeleton, progress and avatar restyle: square surfaces on the ring-border
  token, serif card descriptions, cobalt progress fill, 36px avatars with a
  brand initial fallback; footers drop their muted fill.
- Button and button group restyle: square buttons with 40/44px heights, uppercase
  11px labels, and token-based variants; grouped buttons overlap their borders by
  1px and the pressed button sits above its neighbours.
- Badge restyle: square, uppercase 10px labels; adds a `brand` badge variant
  (cobalt outline) for generating and connected states.
- Form controls restyle: 44px square inputs, selects and textareas on the card
  surface; uppercase field labels and hints; select popup and items use the
  highlight token.
- Checkbox, switch and slider restyle: square checkbox and slider thumb, switch
  track on the paper scale; hit areas kept, focus rings removed (global focus ring).
- Token corrections and global focus rule: heading font is Onest, a serif
  reading font (`font-serif`, Literata) is added, destructive foreground/text
  tokens and sidebar roles are set, and the focus ring and 1.6px square icon
  stroke are global in `src/app/styles/index.css`.
- Paper & ink tokens: new palette (paper, ink, cobalt brand), square corners,
  Onest + Literata fonts (replacing Geist) in `src/app/styles/index.css`; adds
  a `brand` token. Dark values and sidebar roles are inferred from the design.
- Chapter image reader issue: recorded the deferred reader findings
  (`docs/issues/chapter-image-reader-follow-ups.md`).
- Chapter images in the reader: the Reorganize reader renders each EPUB image where
  it stood (`[[img_<id>]]` markers split by `pages/book/model/chapter-images.ts`,
  signed URLs from chapter detail, refetched every 10 minutes while images are shown). Needs the regenerated API client; only
  books parsed after the backend change have images.
- Minimal scrollbars: thin, trackless, fading in and out only while scrolling
  (`shared/lib/scroll-indicator.ts` + `app/styles/index.css`); `color-scheme`
  follows the theme so native controls match light/dark.
- Rename chapters: the Reorganize reader's title is an in-place field (Enter
  keeps, Escape reverts, empty restores). Like other edits it is a draft until
  **Save changes**, which sends one chapter update per renamed chapter.
- Select-all cycle: the book page's select-all first selects chapters without
  audio (none, failed or cancelled), the next click selects every chapter, the
  next clears. Its label names the next click (**Select without audio** /
  **Select all** / **Clear selection**).
- Regenerate chapter audio: selecting chapters that already have audio turns
  **Generate** into **Regenerate selected**; a confirmation lists the chapters
  whose audio will be deleted, then it sends
  `regenerate: true`, which replaces that audio. Needs the regenerated API
  client (`pnpm api:generate`).
- Reorganize chapters page: new `/library/:bookId/reorganize` (split list/reader)
  replaces the hidden review sheet. Read-only text, role tags, per-chapter
  narration toggle and merge. All edits stay in a client-side draft until
  **Save changes** (with **Discard changes** and per-merge undo); saving a merge
  of chapters with audio asks first and deletes that audio. Removed `ChapterCurationPanel`/`Editor` and the unused edit/add/remove strings.
  **Mark as not narrated** / **Remove not narrated** is one toggle button; the **Not narrated** badge and the mark button have an
  explanatory tooltip.
- Book page: chapters tagged **not narrated** have no select checkbox and are
  left out of **Every chapter**, so they can't be queued for audio. Chapter
  cards show the role tag again plus a **Not narrated** tag with a tooltip,
  both at the top right (Not narrated first, in a muted outline style). The select checkbox sits on the
  left and selecting no longer highlights the whole card. In the batch toolbar the
  selection group (**Every chapter**, then the selected count) is on the left
  and the TTS selector and **Generate** are on the far right.
- Delete failed audio: a failed or cancelled chapter audio now shows the delete
  (trash) button next to Continue, so a stuck attempt can be discarded.
- Fish credit reason on Models page: a paid Fish card the backend marks
  `FISH_CREDIT_REQUIRED` shows a localized "add credit" reason (en/ru).
- Qwen3-TTS 0.6B docs: the backend now lists a quantized Qwen3-TTS model; no
  frontend code change, docs updated to say both local models appear.
- Single chapter playback: starting a chapter's audio pauses any other playing
  chapter (`ChapterAudioPlayer` in `BookPage.tsx`).
- History without hashes: renamed "Uncommitted work" to "Recent changes"; entries are
  written before the commit with a unique title and found via
  `git log -S"<title>" -- docs/history.md`.
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

## Older history

- [Milestones archive](history/milestones-archive.md) — milestones before the ones above.
- [Complete commit index](history/commit-index.md) — every committed change, by date and hash.
