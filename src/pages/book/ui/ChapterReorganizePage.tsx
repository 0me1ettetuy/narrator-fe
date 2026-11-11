import { useForm } from '@tanstack/react-form';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  EyeOffIcon,
  LoaderCircleIcon,
  MergeIcon,
  Trash2Icon,
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
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Alert, AlertDescription } from '@/shared/ui/alert';
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
import { Separator } from '@/shared/ui/separator';
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

type TagChange = { role?: ChapterRole; includeInDefaultNarration?: boolean };

export function ChapterReorganizePage({ bookId }: { bookId: string }) {
  const bookQuery = useQuery(
    booksControllerGetBookOptions({ path: { bookId } }),
  );

  return (
    <section className="mx-auto flex h-[calc(100svh-3.5rem)] max-w-6xl flex-col px-4 py-8 sm:px-8">
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
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
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
  // One change per merge, renamed chapter, and chapter in a role/narration edit.
  const changeCount =
    commands.merges.length +
    commands.titles.length +
    commands.tags.reduce((sum, tag) => sum + tag.chapterIds.length, 0);
  const isDirty = changeCount > 0;
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

  const isChanged = (item: DraftChapter) => {
    const original = originalsById.get(item.id);
    return (
      item.sourceIds.length > 1 ||
      !original ||
      original.title !== item.title ||
      original.role !== item.role ||
      original.includeInDefaultNarration !== item.includeInDefaultNarration
    );
  };
  const activeIndex = draft.findIndex((item) => item.id === activeId);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-4 sm:flex-nowrap">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-[32px] leading-[1.1] font-medium tracking-[-0.02em]">
            {t('book.reorganizeChapters')}
          </h1>
          <p className="font-serif text-sm text-muted-foreground">
            {t('book.reorganizeIntro')}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
          {isDirty && (
            <>
              <span
                className="mr-2 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground"
                aria-live="polite"
              >
                <span aria-hidden="true" className="size-1.5 bg-brand" />
                {t('book.changeCount', { count: changeCount })}
              </span>
              <Button
                type="button"
                variant="ghost"
                disabled={save.isPending}
                onClick={() => setIsDiscardOpen(true)}
              >
                {t('book.discardChanges')}
              </Button>
            </>
          )}
          <Button
            type="button"
            disabled={!isDirty || save.isPending}
            onClick={requestSave}
          >
            {save.isPending && (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            )}
            {t('book.saveChanges')}
          </Button>
        </div>
        {save.error && (
          <FieldError className="w-full text-right">
            {t(getApiErrorTranslationKey(save.error))}
          </FieldError>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div
          role="toolbar"
          aria-label={t('book.chapterActions')}
          className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 border-b border-foreground bg-background px-4 py-3"
        >
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
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
            </label>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-[13px] font-semibold" aria-live="polite">
              {t('book.chaptersSelected', { count: selectedIds.length })}
            </span>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <RoleSelect
                  size="sm"
                  disabled={save.isPending}
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
                        disabled={save.isPending}
                        onClick={() =>
                          applyTag(selectedIds, {
                            includeInDefaultNarration: allSkipped,
                          })
                        }
                      />
                    }
                  >
                    <EyeOffIcon aria-hidden="true" />
                    {allSkipped
                      ? t('book.markNarrated')
                      : t('book.markNotNarrated')}
                  </TooltipTrigger>
                  <TooltipContent>
                    {allSkipped
                      ? t('book.narratedHint')
                      : t('book.notNarratedHint')}
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
              </div>
            </div>
          )}
          {selectedIds.length > 1 && !canMerge && (
            <p className="basis-full text-xs text-muted-foreground">
              {t('book.mergeNeedsAdjacent')}
            </p>
          )}
        </div>
        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <section
            aria-label={t('book.chaptersTitle')}
            className={cn(
              'min-h-0 min-w-0 overflow-y-auto',
              activeId && 'hidden lg:block',
            )}
          >
            <ol>
              {draft.map((chapter, index) => (
                <li
                  key={chapter.id}
                  className={cn(
                    'grid min-h-15 grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-x-4 border-b px-4 py-2.5',
                    chapter.id === activeId &&
                      'bg-card shadow-[inset_2px_0_0_var(--brand)]',
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
                    className="flex min-w-0 cursor-pointer flex-col gap-0.5 text-left"
                    aria-current={chapter.id === activeId || undefined}
                    onClick={() => setActiveId(chapter.id)}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn(
                          'truncate font-serif text-base leading-snug',
                          !chapter.includeInDefaultNarration &&
                            'text-muted-foreground',
                        )}
                      >
                        {chapter.title}
                      </span>
                      {isChanged(chapter) && (
                        <span
                          role="img"
                          aria-label={t('book.unsavedChange')}
                          title={t('book.unsavedChange')}
                          className="size-1.5 shrink-0 bg-brand"
                        />
                      )}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {t('book.chapterNumber', { number: index + 1 })}
                      {` · ${t('book.wordCount', { count: chapter.wordCount })}`}
                      {` · ${t(`book.roles.${chapter.role}`)}`}
                      {!chapter.includeInDefaultNarration &&
                        ` · ${t('book.notNarrated')}`}
                      {chapter.sourceIds.length > 1 &&
                        ` · ${t('book.mergedFrom', { count: chapter.sourceIds.length })}`}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <div
            className={cn('min-h-0 min-w-0', !activeId && 'hidden lg:block')}
          >
            {active ? (
              <Reader
                bookId={bookId}
                item={active}
                position={{ index: activeIndex, total: draft.length }}
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
                onStep={(offset) => setActiveId(draft[activeIndex + offset].id)}
                onBack={() => setActiveId(null)}
              />
            ) : (
              <p className="bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
                {t('book.pickChapterToRead')}
              </p>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={isMergeOpen} onOpenChange={setIsMergeOpen}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('book.mergeSelected')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('book.mergeChaptersDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {titlesWithAudio(selected) && (
            <Alert variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertDescription>
                {t('book.mergeAudioNote', {
                  titles: titlesWithAudio(selected),
                })}
              </AlertDescription>
            </Alert>
          )}
          <form
            className="flex flex-col gap-5"
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
                <label className="flex h-11 items-center gap-3 text-sm font-medium">
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                  {t('book.includeInNarration')}
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
                    <MergeIcon aria-hidden="true" />
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
            <AlertDialogMedia variant="destructive">
              <Trash2Icon aria-hidden="true" />
            </AlertDialogMedia>
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

      <AlertDialog open={isDiscardOpen} onOpenChange={setIsDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia variant="destructive">
              <Undo2Icon aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>{t('book.discardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('book.discardDescription', { count: changeCount })}
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
                setIsDiscardOpen(false);
                discardChanges();
              }}
            >
              {t('book.discard')}
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
  position,
  disabled,
  onTag,
  onTitle,
  onUndoMerge,
  onStep,
  onBack,
}: {
  bookId: string;
  item: DraftChapter;
  position: { index: number; total: number };
  disabled: boolean;
  onTag: (change: TagChange) => void;
  onTitle: (title: string) => void;
  onUndoMerge: () => void;
  onStep: (offset: -1 | 1) => void;
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
    <article className="flex h-full min-w-0 flex-col overflow-y-auto bg-card ring-1 ring-border">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="-ml-2 lg:hidden"
          aria-label={t('book.backToChapters')}
          title={t('book.backToChapters')}
          onClick={onBack}
        >
          <ArrowLeftIcon aria-hidden="true" />
        </Button>
        <h2 className="flex-1 text-[13px] font-medium text-muted-foreground">
          {t('book.readerPosition', {
            number: position.index + 1,
            total: position.total,
          })}
          {` · ${t('book.wordCount', { count: item.wordCount })}`}
        </h2>
        {item.sourceIds.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={onUndoMerge}
          >
            <Undo2Icon aria-hidden="true" />
            {t('book.undoMerge')}
          </Button>
        )}
        <Tooltip>
          <TooltipTrigger
            render={
              <label className="mr-2 flex items-center gap-2 text-[13px] font-medium" />
            }
          >
            <Switch
              size="sm"
              checked={item.includeInDefaultNarration}
              disabled={disabled}
              onCheckedChange={(includeInDefaultNarration) =>
                onTag({ includeInDefaultNarration })
              }
            />
            {t('book.includeInNarration')}
          </TooltipTrigger>
          <TooltipContent>
            {item.includeInDefaultNarration
              ? t('book.narratedHint')
              : t('book.notNarratedHint')}
          </TooltipContent>
        </Tooltip>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('book.previousChapter')}
          title={t('book.previousChapter')}
          disabled={position.index === 0}
          onClick={() => onStep(-1)}
        >
          <ChevronUpIcon aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('book.nextChapter')}
          title={t('book.nextChapter')}
          disabled={position.index === position.total - 1}
          onClick={() => onStep(1)}
        >
          <ChevronDownIcon aria-hidden="true" />
        </Button>
      </header>
      <div className="flex flex-col gap-5 border-b px-4 py-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-0 flex-[1_1_14rem] flex-col gap-2">
            <Label htmlFor="reader-chapter-title">
              {t('book.chapterTitle')}
            </Label>
            <Input
              id="reader-chapter-title"
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
          </div>
          <div className="flex w-48 shrink-0 flex-col gap-2">
            <Label htmlFor="reader-chapter-role">{t('book.chapterRole')}</Label>
            <RoleSelect
              id="reader-chapter-role"
              className="w-full"
              value={item.role}
              disabled={disabled}
              onChange={(role) => onTag({ role })}
            />
          </div>
        </div>
      </div>
      <div className="px-4 pt-6 pb-8">
        {text.text !== null ? (
          <div className="flex max-w-[70ch] flex-col gap-4">
            {splitChapterText(text.text).map((part, index) => {
              if (part.kind === 'text') {
                return (
                  <p
                    key={index}
                    className="font-serif text-base leading-7 whitespace-pre-wrap"
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
  size,
  className,
  onChange,
}: {
  id?: string;
  className?: string;
  size?: 'sm' | 'default';
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
      <SelectTrigger id={id} size={size} className={cn('min-w-40', className)}>
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
