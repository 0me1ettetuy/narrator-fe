# Chapter curation: UI entry point hidden

## Status

Deferred. The **Review chapters** button on the book page is commented out.
Nothing else changed: `ChapterCurationPanel.tsx` (the sheet, its editor,
merge/remove/restore/reorder flows, and all its mutations) is fully intact
and untouched, and every backend curation endpoint still works exactly as
before. This is purely "don't render the entry point."

## What changed

- `src/pages/book/ui/BookPage.tsx`: the `ChapterCurationPanel` import and its
  JSX usage (inside the chapters section header, next to the chapter count)
  are commented out, not deleted.

That is the entire change. No other file was touched.

## Why

Product decision to simplify the book page for now while the app focuses on
the core generate-audio flow; chapter curation is a secondary workflow for
fixing a parser's chapter boundaries.

## Restoring

In `BookPage.tsx`:

1. Uncomment `import { ChapterCurationPanel } from './ChapterCurationPanel';`.
2. Uncomment the `{book.chapters.length > 0 && (<ChapterCurationPanel ... />)}`
   block in the chapters section header.

No backend or API changes are needed; nothing there was touched.

See also the backend's
[`docs/features/README.md`, section 8.2](../../../narrator-general-api/docs/features/README.md#82-manual-outline-editing),
updated to note the hidden entry point.
