# Chapter role tags and narrated-chapters quick select: hidden

## Status

Deferred. Several small, related UI elements were commented out together
since they're all chapter-classification display:

1. Each chapter card's role tag badge (e.g. "Main content", "Front matter").
2. The "Excluded from default narration" pill and the dashed "Parser
   suggestion" pill next to it, also on each chapter card.
3. The **Select narrated chapters** quick-select control in the batch-actions
   toolbar, next to **Select all**. Only **Select all** and the per-chapter
   checkboxes remain.

Nothing backend-facing changed: `includeInDefaultNarration`,
`chapter.role`/`classificationReason`, and every related endpoint are
untouched. This is UI-only.

## What changed

All in `src/pages/book/ui/BookPage.tsx`, commented out in place, not deleted:

- `ChapterCard`: the role `<Badge>` showing `book.roles.${chapter.role}`, and,
  separately, the "excluded from narration" pill and the dashed "Parser
  suggestion" pill.
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
generate-audio flow. Related to
[`chapter-curation-hidden.md`](chapter-curation-hidden.md) (same simplification
pass), though that one hides a different control (the **Review chapters**
button) — this one hides read-only tag display and a selection shortcut that
exist independently of curation.

## Restoring

In `src/pages/book/ui/BookPage.tsx`, uncomment, from the bottom up so each
step compiles:

1. `setNarratedChapterSelection` in `BookDetails`.
2. `narratedChapterIds` / `selectedNarratedChapterCount` in `BookDetails`.
3. The three `ChapterBatchActions` props at its call site.
4. The three props in `ChapterBatchActions`'s destructuring and type.
5. `areNarratedChaptersSelected` / `areNarratedChaptersIndeterminate` and the
   `<ChapterSelectionControl id="select-narrated-chapters">` row.
6. The role `<Badge>`, the "excluded from narration" pill, and the "Parser
   suggestion" pill in `ChapterCard`.

See also the backend's
[`docs/features/README.md`, section 6](../../../narrator-general-api/docs/features/README.md#6-narration-inclusion-and-batch-selection).
