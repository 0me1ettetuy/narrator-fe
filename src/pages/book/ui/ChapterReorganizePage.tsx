import { useForm } from '@tanstack/react-form';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  LoaderCircleIcon,
  MergeIcon,
  Undo2Icon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetBookOptions,
  booksControllerGetChapterOptions,
  booksControllerMergeChaptersMutation,
  booksControllerUpdateChapterMutation,
  booksControllerUpdateChapterSelectionMutation,
  getApiErrorTranslationKey,
  type ChapterSummaryResponseDto,
} from '@/shared/api';
import { cn } from '@/shared/lib/utils';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { DataState, ErrorState } from '@/shared/ui/data-state';
import { FieldError } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import { Switch } from '@/shared/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import {
  areAdjacentChapters,
  buildSaveCommands,
  chapterMergeSchema,
  chapterRoles,
  isChapterGenerating,
  mergeDraft,
  toDraft,
  undoMergeDraft,
  type ChapterRole,
  type DraftChapter,
} from '../model/chapter-curation';
import { splitChapterText } from '../model/chapter-images';

const IMAGE_URL_REFRESH_MS = 10 * 60 * 1000;

// Both panels fill the viewport below the page header and toolbar, then scroll.
const PANEL_HEIGHT = 'max-h-[calc(100svh-14rem)] min-h-72 overflow-y-auto';

type TagChange = { role?: ChapterRole; includeInDefaultNarration?: boolean };

export function ChapterReorganizePage({ bookId }: { bookId: string }) {
  const bookQuery = useQuery(
    booksControllerGetBookOptions({ path: { bookId } }),
  );

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <DataState
        query={bookQuery}
        isEmpty={(data) => data.chapters.length === 0}
        loading={<Skeleton className="h-96 w-full" />}
      >
        {(data) => <ChapterEditor bookId={bookId} chapters={data.chapters} />}
      </DataState>
    </section>
  );
}

function ChapterEditor({
  bookId,
  chapters,
}: {
  bookId: string;
  chapters: ChapterSummaryResponseDto[];
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(() => toDraft(chapters));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const originalsById = new Map(
    chapters.map((chapter) => [chapter.id, chapter]),
  );
  const sourcesOf = (item: DraftChapter) =>
    item.sourceIds.flatMap((id) => originalsById.get(id) ?? []);
  const active = draft.find((item) => item.id === activeId);
  const selected = draft.filter((item) => selectedIds.includes(item.id));
  const canMerge =
    areAdjacentChapters(draft, selectedIds) &&
    !selected.some((item) => sourcesOf(item).some(isChapterGenerating));
  const commands = buildSaveCommands(draft, chapters);
  const isDirty =
    commands.merges.length + commands.tags.length + commands.titles.length > 0;
  const titlesWithAudio = (items: DraftChapter[]) =>
    items
      .flatMap(sourcesOf)
      .filter((chapter) => chapter.audio)
      .map((chapter) => `“${chapter.title}”`)
      .join(', ');
  const mergedAudioTitles = titlesWithAudio(
    draft.filter((item) => item.sourceIds.length > 1),
  );

  // Edits are local until Save; warn before a reload throws them away.
  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const mergeApi = useMutation(booksControllerMergeChaptersMutation());
  const tagApi = useMutation(booksControllerUpdateChapterSelectionMutation());
  const titleApi = useMutation(booksControllerUpdateChapterMutation());
  const save = useMutation({
    mutationFn: async () => {
      for (const merge of commands.merges) {
        await mergeApi.mutateAsync({
          path: { bookId },
          body: { ...merge, discardAudio: true },
        });
      }
      for (const tag of commands.tags) {
        await tagApi.mutateAsync({ path: { bookId }, body: tag });
      }
      for (const { chapterId, title } of commands.titles) {
        await titleApi.mutateAsync({
          path: { bookId, chapterId },
          body: { title },
        });
      }
    },
    // Success or partial failure, show what the server actually has now.
    onSettled: async () => {
      const fresh = await queryClient.fetchQuery({
        ...booksControllerGetBookOptions({ path: { bookId } }),
        staleTime: 0,
      });
      setDraft(toDraft(fresh.chapters));
      setSelectedIds([]);
      setActiveId(null);
    },
  });
  const mergeForm = useForm({
    defaultValues: {
      title: '',
      role: 'MAIN' as ChapterRole,
      includeInDefaultNarration: true,
    },
    validators: { onChange: chapterMergeSchema, onSubmit: chapterMergeSchema },
    onSubmit: ({ value }) => {
      setDraft(mergeDraft(draft, selectedIds, value));
      setActiveId(selected[0].id);
      setSelectedIds([]);
      setIsMergeOpen(false);
    },
  });

  // Default is "mark as not narrated"; it flips back only when every selected chapter is already not narrated.
  const allSkipped =
    selected.length > 0 && selected.every((c) => !c.includeInDefaultNarration);

  function applyTag(ids: string[], change: TagChange) {
    setDraft((current) =>
      current.map((item) =>
        ids.includes(item.id) ? { ...item, ...change } : item,
      ),
    );
  }

  function openMerge() {
    mergeForm.reset({
      title: selected[0].title,
      role: selected[0].role,
      includeInDefaultNarration: selected[0].includeInDefaultNarration,
    });
    setIsMergeOpen(true);
  }

  function discardChanges() {
    save.reset();
    setDraft(toDraft(chapters));
    setSelectedIds([]);
    setActiveId(null);
  }

  function requestSave() {
    if (mergedAudioTitles) {
      setIsSaveConfirmOpen(true);
    } else {
      save.mutate();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 border p-3">
        <RoleSelect
          disabled={selectedIds.length === 0 || save.isPending}
          onChange={(role) => applyTag(selectedIds, { role })}
          placeholder={t('book.setRole')}
        />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={selectedIds.length === 0 || save.isPending}
                onClick={() =>
                  applyTag(selectedIds, {
                    includeInDefaultNarration: allSkipped,
                  })
                }
              />
            }
          >
            {allSkipped ? t('book.markNarrated') : t('book.markNotNarrated')}
          </TooltipTrigger>
          <TooltipContent>
            {allSkipped ? t('book.narratedHint') : t('book.notNarratedHint')}
          </TooltipContent>
        </Tooltip>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canMerge || save.isPending}
          onClick={openMerge}
        >
          <MergeIcon aria-hidden="true" />
          {t('book.mergeSelected')}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!isDirty || save.isPending}
            onClick={discardChanges}
          >
            {t('book.discardChanges')}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!isDirty || save.isPending}
            onClick={requestSave}
          >
            {save.isPending && (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            )}
            {t('book.saveChanges')}
          </Button>
        </div>
        {selectedIds.length > 1 && !canMerge && (
          <p className="w-full text-right text-xs text-muted-foreground">
            {t('book.mergeNeedsAdjacent')}
          </p>
        )}
        {save.error && (
          <FieldError className="w-full">
            {t(getApiErrorTranslationKey(save.error))}
          </FieldError>
        )}
      </div>

      <div className="grid overflow-hidden border lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:divide-x">
        <div className={cn(!activeId && 'hidden lg:block')}>
          {active ? (
            <Reader
              bookId={bookId}
              item={active}
              disabled={save.isPending}
              onTag={(change) => applyTag([active.id], change)}
              onTitle={(title) =>
                setDraft((current) =>
                  current.map((entry) =>
                    entry.id === active.id ? { ...entry, title } : entry,
                  ),
                )
              }
              onUndoMerge={() =>
                setDraft((current) =>
                  undoMergeDraft(current, active.id, chapters),
                )
              }
              onBack={() => setActiveId(null)}
            />
          ) : (
            <p className="p-6 text-sm text-muted-foreground">
              {t('book.pickChapterToRead')}
            </p>
          )}
        </div>

        <div className={cn(activeId && 'hidden lg:block')}>
          <div className={PANEL_HEIGHT}>
            <label className="sticky top-0 z-10 flex cursor-pointer items-center gap-3 border-b bg-background px-3 py-2 text-sm font-medium text-muted-foreground">
              <Checkbox
                className="cursor-pointer"
                checked={selectedIds.length === draft.length}
                indeterminate={
                  selectedIds.length > 0 && selectedIds.length < draft.length
                }
                onCheckedChange={(checked) =>
                  setSelectedIds(checked ? draft.map((c) => c.id) : [])
                }
              />
              {t('book.everyChapter')}
              <span className="ml-auto font-normal" aria-live="polite">
                {t('book.chaptersSelected', { count: selectedIds.length })}
              </span>
            </label>
            <ol className="divide-y">
              {draft.map((chapter) => (
                <li
                  key={chapter.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 hover:bg-muted/50',
                    chapter.id === activeId && 'bg-muted',
                  )}
                >
                  <Checkbox
                    className="cursor-pointer"
                    checked={selectedIds.includes(chapter.id)}
                    aria-label={t('book.selectChapter', {
                      title: chapter.title,
                    })}
                    onCheckedChange={(checked) =>
                      setSelectedIds((current) =>
                        checked
                          ? [...current, chapter.id]
                          : current.filter((id) => id !== chapter.id),
                      )
                    }
                  />
                  <button
                    type="button"
                    className="min-w-0 flex-1 cursor-default text-left focus-visible:outline-2"
                    onClick={() => setActiveId(chapter.id)}
                  >
                    <span
                      className={cn(
                        'block truncate font-medium',
                        !chapter.includeInDefaultNarration &&
                          'text-muted-foreground',
                      )}
                    >
                      {chapter.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('book.wordCount', { count: chapter.wordCount })}
                      {chapter.sourceIds.length > 1 &&
                        ` · ${t('book.mergedFrom', { count: chapter.sourceIds.length })}`}
                    </span>
                  </button>
                  <div className="flex shrink-0 flex-col items-end justify-between gap-1 self-stretch text-xs text-muted-foreground">
                    {chapter.includeInDefaultNarration ? (
                      <span />
                    ) : (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Badge
                              variant="outline"
                              tabIndex={0}
                              className="cursor-default"
                            />
                          }
                        >
                          {t('book.notNarrated')}
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('book.notNarratedHint')}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <span>{t(`book.roles.${chapter.role}`)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <AlertDialog open={isMergeOpen} onOpenChange={setIsMergeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('book.mergeSelected')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('book.mergeChaptersDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {titlesWithAudio(selected) && (
            <p className="border p-3 text-sm text-muted-foreground">
              {t('book.mergeAudioNote', { titles: titlesWithAudio(selected) })}
            </p>
          )}
          <form
            className="space-y-4"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void mergeForm.handleSubmit();
            }}
          >
            <mergeForm.Field name="title">
              {(field) => {
                const error = field.state.meta.errors[0];
                return (
                  <div className="space-y-2">
                    <Label htmlFor="merged-chapter-title">
                      {t('book.chapterTitle')}
                    </Label>
                    <Input
                      id="merged-chapter-title"
                      value={field.state.value}
                      aria-invalid={Boolean(error)}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    {error && <FieldError>{t(error.message)}</FieldError>}
                  </div>
                );
              }}
            </mergeForm.Field>
            <mergeForm.Field name="role">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="merged-chapter-role">
                    {t('book.chapterRole')}
                  </Label>
                  <RoleSelect
                    id="merged-chapter-role"
                    value={field.state.value}
                    onChange={field.handleChange}
                  />
                </div>
              )}
            </mergeForm.Field>
            <mergeForm.Field name="includeInDefaultNarration">
              {(field) => (
                <label className="flex items-center justify-between gap-3 border p-3">
                  <span className="font-medium">
                    {t('book.includeInNarration')}
                  </span>
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </label>
              )}
            </mergeForm.Field>
            <AlertDialogFooter>
              <AlertDialogCancel autoFocus>
                {t('common.cancel')}
              </AlertDialogCancel>
              <mergeForm.Subscribe selector={(state) => state.canSubmit}>
                {(canSubmit) => (
                  <Button type="submit" disabled={!canSubmit}>
                    {t('book.mergeChapters')}
                  </Button>
                )}
              </mergeForm.Subscribe>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('book.saveChanges')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('book.mergeDeletesAudio', { titles: mergedAudioTitles })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus>
              {t('common.cancel')}
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setIsSaveConfirmOpen(false);
                save.mutate();
              }}
            >
              {t('book.saveAndDeleteAudio')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Reader({
  bookId,
  item,
  disabled,
  onTag,
  onTitle,
  onUndoMerge,
  onBack,
}: {
  bookId: string;
  item: DraftChapter;
  disabled: boolean;
  onTag: (change: TagChange) => void;
  onTitle: (title: string) => void;
  onUndoMerge: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  // Title as it was when editing began, for Escape and for an emptied field.
  const titleOnFocus = useRef(item.title);
  // A merged chapter reads as its sources joined, as the server will join them.
  const text = useQueries({
    queries: item.sourceIds.map((chapterId) => ({
      ...booksControllerGetChapterOptions({ path: { bookId, chapterId } }),
      // Image URLs are signed for 15 minutes; fetch fresh ones before they expire.
      refetchInterval: (query: { state: { data?: { images: unknown[] } } }) =>
        query.state.data?.images.length ? IMAGE_URL_REFRESH_MS : false,
    })),
    combine: (results) => ({
      text: results.every((result) => result.data)
        ? results.map((result) => result.data?.text).join('\n\n')
        : null,
      images: results.flatMap((result) => result.data?.images ?? []),
      isError: results.some((result) => result.isError),
      refetch: () => results.forEach((result) => void result.refetch()),
    }),
  });

  return (
    <article className={PANEL_HEIGHT}>
      <header className="sticky top-0 z-10 space-y-3 border-b bg-background p-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 lg:hidden"
          onClick={onBack}
        >
          <ArrowLeftIcon aria-hidden="true" />
          {t('book.backToChapters')}
        </Button>
        <div className="flex items-baseline justify-between gap-4">
          <Input
            aria-label={t('book.chapterTitle')}
            className="flex-1 font-semibold"
            value={item.title}
            maxLength={500}
            disabled={disabled}
            onFocus={() => {
              titleOnFocus.current = item.title;
            }}
            onChange={(event) => onTitle(event.target.value)}
            onBlur={(event) =>
              onTitle(event.target.value.trim() || titleOnFocus.current)
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              } else if (event.key === 'Escape') {
                onTitle(titleOnFocus.current);
                event.currentTarget.blur();
              }
            }}
          />
          <span className="shrink-0 text-sm text-muted-foreground">
            {t('book.wordCount', { count: item.wordCount })}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <RoleSelect
            value={item.role}
            disabled={disabled}
            onChange={(role) => onTag({ role })}
          />
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={item.includeInDefaultNarration}
              disabled={disabled}
              onCheckedChange={(includeInDefaultNarration) =>
                onTag({ includeInDefaultNarration })
              }
            />
            {t('book.includeInNarration')}
          </label>
          {item.sourceIds.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto"
              disabled={disabled}
              onClick={onUndoMerge}
            >
              <Undo2Icon aria-hidden="true" />
              {t('book.undoMerge')}
            </Button>
          )}
        </div>
      </header>
      <div className="p-4">
        {text.text !== null ? (
          <div className="max-w-[70ch] space-y-4">
            {splitChapterText(text.text).map((part, index) => {
              if (part.kind === 'text') {
                return (
                  <p
                    key={index}
                    className="whitespace-pre-wrap text-base leading-[1.6]"
                  >
                    {part.value}
                  </p>
                );
              }

              const image = text.images.find(({ id }) => id === part.id);

              // A marker with no image (edited text) shows nothing, never its raw text.
              return image ? (
                <img
                  key={index}
                  src={image.url}
                  alt={image.alt ?? t('book.chapterImage')}
                  loading="lazy"
                  decoding="async"
                  className="max-h-[32rem] max-w-full border object-contain"
                />
              ) : null;
            })}
          </div>
        ) : text.isError ? (
          <ErrorState onRetry={text.refetch} />
        ) : (
          <Skeleton className="h-64 w-full" />
        )}
      </div>
    </article>
  );
}

function RoleSelect({
  id,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  id?: string;
  value?: ChapterRole;
  placeholder?: string;
  disabled?: boolean;
  onChange: (role: ChapterRole) => void;
}) {
  const { t } = useTranslation();

  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => onChange(next as ChapterRole)}
    >
      <SelectTrigger id={id} className="min-w-40">
        <SelectValue>
          {(role: ChapterRole | null) =>
            role ? t(`book.roles.${role}`) : placeholder
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {chapterRoles.map((role) => (
          <SelectItem key={role} value={role}>
            {t(`book.roles.${role}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
