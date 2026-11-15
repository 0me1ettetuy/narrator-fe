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
  chapters: { id: string }[],
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

// Edits on the organize page stay in this client-side draft until Save.
export type DraftChapter = {
  /** First source chapter's id; the one that survives a merge on the server. */
  id: string;
  sourceIds: string[];
  title: string;
  wordCount: number;
  role: ChapterRole;
  includeInDefaultNarration: boolean;
};

export function toDraft(chapters: ChapterSummaryResponseDto[]): DraftChapter[] {
  return chapters.map((chapter) => ({
    id: chapter.id,
    sourceIds: [chapter.id],
    title: chapter.title,
    wordCount: chapter.wordCount,
    role: chapter.role,
    includeInDefaultNarration: chapter.includeInDefaultNarration,
  }));
}

export function mergeDraft(
  draft: DraftChapter[],
  ids: string[],
  values: Pick<DraftChapter, 'title' | 'role' | 'includeInDefaultNarration'>,
): DraftChapter[] {
  const picked = draft.filter((item) => ids.includes(item.id));
  const merged: DraftChapter = {
    ...values,
    id: picked[0].id,
    sourceIds: picked.flatMap((item) => item.sourceIds),
    wordCount: picked.reduce((total, item) => total + item.wordCount, 0),
  };

  return draft.flatMap((item) =>
    item.id === merged.id ? [merged] : ids.includes(item.id) ? [] : [item],
  );
}

export function undoMergeDraft(
  draft: DraftChapter[],
  id: string,
  originals: ChapterSummaryResponseDto[],
): DraftChapter[] {
  const item = draft.find((candidate) => candidate.id === id);
  if (!item) {
    return draft;
  }
  const restored = toDraft(
    originals.filter((chapter) => item.sourceIds.includes(chapter.id)),
  );

  return draft.flatMap((candidate) =>
    candidate.id === id ? restored : [candidate],
  );
}

export type SaveCommands = {
  merges: {
    chapterIds: string[];
    title: string;
    role: ChapterRole;
    includeInDefaultNarration: boolean;
  }[];
  tags: {
    chapterIds: string[];
    role?: ChapterRole;
    includeInDefaultNarration?: boolean;
  }[];
  titles: { chapterId: string; title: string }[];
};

// What the server must do to turn `originals` into `draft`: merges first,
// then role/narration changes grouped so each distinct change is one call,
// then one call per renamed chapter.
export function buildSaveCommands(
  draft: DraftChapter[],
  originals: ChapterSummaryResponseDto[],
): SaveCommands {
  const merges: SaveCommands['merges'] = [];
  const titles: SaveCommands['titles'] = [];
  const tagGroups = new Map<string, SaveCommands['tags'][number]>();

  for (const item of draft) {
    if (item.sourceIds.length > 1) {
      merges.push({
        chapterIds: item.sourceIds,
        title: item.title,
        role: item.role,
        includeInDefaultNarration: item.includeInDefaultNarration,
      });
      continue;
    }

    const original = originals.find((chapter) => chapter.id === item.id);
    if (!original) {
      continue;
    }
    if (item.title !== original.title) {
      titles.push({ chapterId: item.id, title: item.title });
    }
    const change: Omit<SaveCommands['tags'][number], 'chapterIds'> = {};
    if (item.role !== original.role) {
      change.role = item.role;
    }
    if (item.includeInDefaultNarration !== original.includeInDefaultNarration) {
      change.includeInDefaultNarration = item.includeInDefaultNarration;
    }
    if (Object.keys(change).length === 0) {
      continue;
    }
    const key = JSON.stringify(change);
    const group = tagGroups.get(key) ?? { chapterIds: [], ...change };
    group.chapterIds.push(item.id);
    tagGroups.set(key, group);
  }

  return { merges, tags: [...tagGroups.values()], titles };
}
