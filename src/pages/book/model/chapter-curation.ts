import { z } from 'zod';
import type { ChapterSummaryResponseDto } from '@/shared/api';

export const chapterRoles = [
  'MAIN',
  'FRONT_MATTER',
  'NAVIGATION',
  'REFERENCE',
  'BACK_MATTER',
  'OTHER',
] as const;

export type ChapterRole = (typeof chapterRoles)[number];

export const chapterEditorSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: 'validation.chapterTitleRequired' })
    .max(500, { error: 'validation.chapterTitleTooLong' }),
  text: z
    .string()
    .trim()
    .min(1, { error: 'validation.chapterTextRequired' })
    .max(1_000_000, { error: 'validation.chapterTextTooLong' }),
  role: z.enum(chapterRoles),
  includeInDefaultNarration: z.boolean(),
});

export const chapterCreateSchema = chapterEditorSchema;

export const chapterMergeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: 'validation.chapterTitleRequired' })
    .max(500, { error: 'validation.chapterTitleTooLong' }),
  role: z.enum(chapterRoles),
  includeInDefaultNarration: z.boolean(),
});

export function isChapterGenerating(
  chapter: ChapterSummaryResponseDto,
): boolean {
  return (
    chapter.audio?.status === 'QUEUED' ||
    chapter.audio?.status === 'PROCESSING' ||
    chapter.audio?.status === 'DELETING'
  );
}

export function areAdjacentChapters(
  chapters: ChapterSummaryResponseDto[],
  selectedChapterIds: string[],
): boolean {
  if (selectedChapterIds.length < 2) {
    return false;
  }

  const selectedIds = new Set(selectedChapterIds);
  const selectedIndexes = chapters
    .map((chapter, index) => (selectedIds.has(chapter.id) ? index : -1))
    .filter((index) => index >= 0);

  return selectedIndexes.every(
    (index, offset) => index === selectedIndexes[0] + offset,
  );
}
