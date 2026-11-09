# Narrated-chapters quick select and parser-suggestion pill: hidden

## Status

Deferred. Two chapter-classification UI elements remain commented out. The
chapter card's role tag and **Not narrated** tag (with tooltip) were restored,
and chapters tagged not narrated have no select checkbox.

1. The dashed "Parser suggestion" pill on each chapter card.
2. The **Select narrated chapters** quick-select control in the batch-actions
   toolbar, next to **Select all**. Only **Select all** and the per-chapter
   checkboxes remain.

Nothing backend-facing changed: `includeInDefaultNarration`,
`chapter.role`/`classificationReason`, and every related endpoint are
untouched. This is UI-only.

## What changed

All in `src/pages/book/ui/BookPage.tsx`, commented out in place, not deleted:

- `ChapterCard`: the dashed "Parser suggestion" pill.
- `ChapterBatchActions`: the `narratedChapterCount` /
  `selectedNarratedChapterCount` / `onNarratedSelectionChange` props (both in
  the destructured params and the type), the `areNarratedChaptersSelected` /
  `areNarratedChaptersIndeterminate` derived booleans, and the
  `<ChapterSelectionControl id="select-narrated-chapters">` row.
- `BookDetails` (the caller): the three props passed into
  `<ChapterBatchActions>`, the `narratedChapterIds` /
  `selectedNarratedChapterCount` derivations, and the
  `setNarratedChapterSelection` handler function.

## Why

Simplifying the book page's chapter list and batch-selection toolbar; role
tags and the narrated-only quick select are secondary to the core
generate-audio flow. Tagging and narration are now managed on the separate
**Reorganize chapters** page (`/library/:bookId/reorganize`).

## Restoring

In `src/pages/book/ui/BookPage.tsx`, uncomment, from the bottom up so each
step compiles:

1. `setNarratedChapterSelection` in `BookDetails`.
2. `narratedChapterIds` / `selectedNarratedChapterCount` in `BookDetails`.
3. The three `ChapterBatchActions` props at its call site.
4. The three props in `ChapterBatchActions`'s destructuring and type.
5. `areNarratedChaptersSelected` / `areNarratedChaptersIndeterminate` and the
   `<ChapterSelectionControl id="select-narrated-chapters">` row.
6. The "Parser suggestion" pill in `ChapterCard`.

See also the backend's
[backend feature docs, narration selection](../../../narrator-general-api/docs/features/narration-selection.md).
