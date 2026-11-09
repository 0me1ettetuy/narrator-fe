# Chapter images in the reader: deferred follow-ups

Status: deferred. The behavior is described in
[`product-behavior.md`](../features/product-behavior.md); backend items are in
the [backend follow-ups](../../../narrator-general-api/docs/issues/chapter-image-follow-ups.md).

- **Inline images split a sentence.** `He said [[img_…]] stop.` renders as the
  text "He said", the image (up to 32 rem tall), then "stop.". Small inline
  icons or formula glyphs should stay in the line. `splitChapterText` cannot
  tell a block image from an inline one; the marker needs to carry that, or the
  reader should treat a marker with text on both sides on one line as inline.
- **Decorative images read "Illustration".** The reader uses
  `image.alt ?? t('book.chapterImage')`. The backend turns an EPUB's `alt=""`
  into `null`, so spacers and ornaments are announced. Once the backend keeps
  `''`, render `alt=""` for it.
- **No test for `splitChapterText`.** The repo has no test runner; it was
  checked once with a throwaway script (plain text, text-image-text,
  marker-only, two markers, malformed marker, empty). Add it if a runner is
  added.
- **Images only show in the Reorganize reader.** The book page has no chapter
  text, so nothing else needs them yet.
