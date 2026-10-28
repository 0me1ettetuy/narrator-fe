# Chapter curation frontend plan

## Product behavior

The Book page lets a user turn the imported EPUB outline into the outline they
actually want to read or hear.

The simple path remains simple:

```text
Upload EPUB -> chapters appear with safe suggestions
            -> Select narrated chapters
            -> Generate audio
```

Editing tools are available when a book needs correction:

```text
Review chapters -> set a role, include/exclude, merge, edit, add/remove/reorder
```

Narrator never silently removes a short chapter or joins unrelated material.

## Core interaction model

### Role chips and narration inclusion

Each chapter has a single role chip:

```text
Main content | Front matter | Contents | Reference | Back matter | Other
```

The role says what a section is. A separate include switch controls whether it
is in the default narration selection. A preface may therefore remain Front
matter and still be selected for audio.

Show a concise source-backed suggestion when available:

```text
Suggested: Contents (from EPUB navigation)
Review: Very short section
```

Never expose raw EPUB XML/source paths or raw backend errors.

### Audio selection

Replace the current literal Select all action with:

```text
Select narrated chapters   -> chapters included by default
Select every active chapter -> explicit opt-in for contents/references too
```

The existing Generate/Continue and Stop controls act on the current selection.

### Curation actions

- **Change role / Include in narration**: quick row action and batch action;
  existing audio stays because text has not changed.
- **Edit chapter**: a focused editor has title, plain-text body, word count,
  role, inclusion, and a parser suggestion.
- **Add chapter**: add a plain-text chapter after the selected chapter.
- **Merge chapters**: enable only for adjacent selected chapters. Confirm the
  result title, role, inclusion, order, and total word count.
- **Remove chapter**: remove it from the active outline, but preserve it in a
  Restorable list. Do not imply the source EPUB has been destroyed.
- **Reorder**: use accessible Move up/Move down controls first. Do not begin
  with drag-and-drop; it is weaker for keyboard and mobile users.

Text edits, merging, and removal show a confirmation when they must delete
existing audio. If audio is currently generating, disable the action and say
that generation must be stopped first.

## Layout

### Normal Book page

```text
Book header and metadata

Chapter actions
  [Review 3 suggestions] [Select narrated] [Select every chapter]
  [Generate selected] [Stop selected]

Chapters
  Included sections
  Excluded sections (collapsible, but always discoverable)
```

When every section in a group is excluded, collapse the group to reduce noise,
but show its count and a Show action. Excluded content must never disappear.

### Review chapters workspace

Use a page-local shadcn `Sheet`/dialog on wide screens and a full-screen
dialog on narrow screens:

```text
Header: Review chapters, review count, Undo last action
Filters: All | Needs review | Included | Excluded | Removed
List: checkbox, order, title, words, role, inclusion switch, actions
Bulk toolbar: Set role, Include/Exclude, Merge, Remove
Editor: title, text, role, inclusion, save/cancel
```

Load full chapter text only when the editor opens. The normal book-detail
query remains small enough for the current progress polling.

## FSD placement

This is currently only on the Book page, so keep it page-local. Do not create
a speculative `entities/chapter` or global editor feature.

```text
src/pages/book/
  ui/
    BookPage.tsx
    ChapterCurationPanel.tsx
    ChapterCurationEditor.tsx
    ChapterRoleBadge.tsx
  model/
    chapter-curation.ts
    chapter-curation-form.ts
```

Use only public `@/shared/api` exports for generated queries/mutations. Use
existing shadcn primitives: `Sheet`, `Dialog`, `AlertDialog`, `Checkbox`,
`Select`, `Switch`, `Textarea`, `Button`, and `Badge`.

Server data remains in TanStack Query. Only unsaved form text, filters, and
selected chapter IDs are local UI state. If the same editor later serves a
reader and library page, then extract a focused feature through `index.ts`.

## Query and cache plan

1. `GET /books/:bookId` gains role, inclusion, and safe review-suggestion
   fields for active chapters.
2. `GET /books/:bookId/chapters/:chapterId` loads full text on demand.
3. Every curation mutation invalidates the exact book-detail query key.
4. Text-changing, merge, remove, restore, and reorder mutations clear the
   current selection because IDs/order may have changed.
5. Existing status polling stays in place while audio work is active. Curation
   invalidates after success and relies on the normal query for persisted state.

## Forms, errors, and accessibility

Use TanStack Form plus Zod for the chapter editor and merge dialog:

```text
title                 trimmed, required, bounded
text                  trimmed, required for an active chapter, bounded
role                  one backend enum value
includeInDefault...   boolean
chapterIds            unique UUIDs; merge requires adjacency in API and UI
```

The API remains authoritative for ownership, adjacency, active-generation
conflicts, and safe audio cleanup. Use stable backend error codes and the
existing error mapper—never display `error.message`.

Add every label, aria label, confirmation, toast, loading state, and error to
both `shared/i18n/en.ts` and `shared/i18n/ru.ts`. Ensure the review list,
bulk actions, dialogs, filtering, focus return, and move controls work with a
keyboard and on narrow screens.

## Delivery order

1. Render parser roles/suggestions and change Select narrated chapters.
2. Add quick/bulk role and inclusion controls.
3. Add on-demand chapter editor with audio-warning confirmation.
4. Add remove/restore and a Removed filter.
5. Add adjacent merge dialog and accessible reordering.
6. Add bounded Undo feedback. Test keyboard, mobile, long titles, theme
   variants, parser suggestions, and active/ready/failed audio states.

## UX acceptance criteria

- Audio generation works immediately without requiring EPUB knowledge.
- The user can understand and override a Contents/Reference/Other suggestion
  in one clear action.
- A short real chapter is never silently lost.
- Default audio selection does not accidentally narrate a contents list, while
  the user can explicitly include every section.
- Split chapters can be merged; combined chapters can be edited or replaced.
- Content-changing actions clearly explain their audio consequences and cannot
  race a running generation.
- Refreshing retains all curation decisions.
