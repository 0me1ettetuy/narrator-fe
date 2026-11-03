# Adaptive design plan (temporary)

Working plan for making the frontend usable from phone to desktop. Delete this
file once every item below is done (last step). Not linked from
`docs/README.md` on purpose.

## Targets

- Widths to check: **375** (phone), **768** (tablet, sidebar switch point),
  **1024**, **1280** (desktop).
- Tailwind default breakpoints only (`sm` 640, `md` 768, `lg` 1024, `xl`
  1280). No new breakpoints or config.
- The sidebar already turns into a sheet below 768px
  (`src/shared/lib/use-mobile.ts`, `src/shared/ui/sidebar.tsx`); keep that.
- Rules for every page: no horizontal page scroll, 16px side gutter minimum,
  tap targets about 40px+, nothing important hidden behind hover only, text
  truncates or wraps instead of overflowing.

## Phase 0 — blocker: no navigation on phones

Below 768px the sidebar is a closed sheet, and its only toggle
(`SidebarToggleButton`) lives inside that sheet. Phone users cannot open
navigation, sign out, or switch theme/locale.

- [x] Add a toggle button to `AuthorizedHeader.tsx`, visible only below `md`
      (`md:hidden`), using the `sidebar.toggle` i18n label. (Used a plain
      `Button` rather than the library's `SidebarTrigger`, whose sr-only text
      is English-only.)
- [x] Close the mobile sheet on navigation: an effect in
      `AuthorizedSidebar.tsx` calls `setOpenMobile(false)` when the pathname
      changes, so it also covers the back button, not just link taps.
- [ ] Check `HeaderBreadcrumbs` truncates long book titles at 375px instead of
      pushing the header wider.

## Phase 1 — shared layout consistency

Page containers differ for no reason:

| Page    | Container now                          |
| ------- | -------------------------------------- |
| Book    | `max-w-5xl px-4 py-8`                  |
| Library | `max-w-6xl px-4 py-6 sm:px-6 sm:py-10` |
| Models  | `max-w-6xl px-4 py-6 sm:px-6 sm:py-10` |
| Home    | `max-w-5xl px-4 py-16`                 |

- [x] Pick one gutter/vertical rhythm (suggest the Library/Models one) and
      apply it to Book and Home. Keep each page's own `max-w-*`.
- [x] Public header (`src/widgets/public-header/ui/PublicHeader.tsx`): hid
      the signed-in email below `sm` (avatar stays), since a long address
      could overflow a 375px header. Not measured in a browser yet.

## Phase 2 — book page (`src/pages/book/ui/BookPage.tsx`, biggest risk)

- [x] **Header card** (`BookOverview`): cover stacks above text below `sm`
      (already `flex-col sm:flex-row`); check title wrap, badges row, and the
      **Delete book** button (`ml-auto`) at 375px.
- [x] **Batch toolbar** (`ChapterBatchActions`): Generate + `TtsSelector` +
      selected-count badge + **Every chapter** on one row only from `lg`.
      At 375px confirm the wrap order reads well and `TtsSelector`
      (`max-w-56`) doesn't overflow.
- [x] **Chapter card**: meta line + title + checkbox; long titles wrap
      (`break-words`), checkbox stays top-right.
- [x] **Audio player row** (`ChapterAudioControls` / `ChapterAudioPlayer`):
      play + scrubber + times + download + delete in one row. At 375px the
      scrubber must keep usable width; if not, move download/delete under the
      scrubber below `sm`.
      Result: at 375px the scrubber is about 160px wide by arithmetic, which
      is usable, so download/delete stay in the row. Not browser-measured.
- [x] Non-ready status box (`ChapterAudioStatus`): label + voice badge +
      percent + action button on one row; let it wrap below `sm`.
- [x] Cover viewer/editor dialogs: already `max-w-[calc(100%-2rem)]` /
      `sm:max-w-lg`; quick check only.

## Phase 3 — library (`src/pages/library/ui/*`)

- [ ] Book grid is 1 → 2 (`sm`) → 3 (`xl`) columns; check card content
      (cover, title, author, delete) at 375 and 640.
- [ ] Upload dialog (`EpubUploadForm`, `sm:max-w-lg`): drop zone and buttons
      at 375px.

## Phase 4 — models (`src/pages/models/ui/*`)

- [ ] Model cards grid (`sm:grid-cols-2`): check at 375/640.
- [ ] `FishCredentialForm`: key input + buttons wrap cleanly.
- [ ] `FishVoiceManager`: picker row (`sm:grid-cols-[…]`) and voice list rows
      (name + badges + long referenceId `code` + remove button) at 375px;
      referenceId must truncate, not overflow.
- [ ] `FishVoiceForm` (`sm:grid-cols-2 lg:grid-cols-[…]`): field order and
      the **Add voice** button placement at each breakpoint.

## Phase 5 — public and auth pages

- [ ] Hero, About, Home: headline size at 375px (no 3+ line headlines).
- [ ] Login, Register (`max-w-md`): fine by design; quick check only.
- [ ] Not found / route error: quick check only.

## Out of scope

- Hidden features (chapter curation panel, tags): stay hidden; don't adapt
  them now. Note any obvious issue in their `docs/issues/*.md` instead.
- New mobile-only UI (bottom nav, gestures, separate mobile components).
- Landscape-phone or >1280px tuning.

## How to verify

1. Run `pnpm dev` with the backend up (authenticated pages need it); use a
   book that has chapters with ready, queued and no audio.
2. In a real browser, check each page above at 375 / 768 / 1024 / 1280.
   Screenshot before/after for anything changed.
3. `pnpm lint`, `pnpm format:check`, `pnpm build` after each phase.
4. Every new visible string (e.g. a trigger label) needs EN + RU.

## Done when

- [ ] All boxes above checked.
- [ ] Any lasting rule worth keeping (e.g. the container pattern) is moved
      into `CLAUDE.md` or `docs/architecture/frontend-architecture.md`.
- [ ] This file is deleted.
