export type ChapterTextPart =
  { kind: 'text'; value: string } | { kind: 'image'; id: string };

// Backend marker for where an EPUB image stood in the chapter text.
const IMAGE_MARKER =
  /\[\[img_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]\]/giu;

export function splitChapterText(text: string): ChapterTextPart[] {
  // With one capture group, split() puts every marker id at an odd index.
  return text
    .split(IMAGE_MARKER)
    .map((part, index): ChapterTextPart =>
      index % 2
        ? { kind: 'image', id: part.toLowerCase() }
        : { kind: 'text', value: part.trim() },
    )
    .filter((part) => part.kind === 'image' || part.value !== '');
}
