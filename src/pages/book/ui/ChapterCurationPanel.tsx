import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FilePlus2Icon,
  LoaderCircleIcon,
  MergeIcon,
  PencilIcon,
  RotateCcwIcon,
  TagsIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerCreateChapterMutation,
  booksControllerListRemovedChaptersOptions,
  booksControllerMergeChaptersMutation,
  booksControllerRemoveChapterMutation,
  booksControllerReorderChaptersMutation,
  booksControllerRestoreChapterMutation,
  booksControllerUpdateChapterSelectionMutation,
  getApiErrorTranslationKey,
  type ChapterSummaryResponseDto,
} from '@/shared/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';
import { Switch } from '@/shared/ui/switch';
import { Textarea } from '@/shared/ui/textarea';
import {
  areAdjacentChapters,
  chapterCreateSchema,
  chapterMergeSchema,
  chapterRoles,
  isChapterGenerating,
  type ChapterRole,
} from '../model/chapter-curation';
import { ChapterCurationEditor } from './ChapterCurationEditor';

type ChapterCurationPanelProps = {
  bookId: string;
  chapters: ChapterSummaryResponseDto[];
  selectedChapterIds: string[];
  onBookChanged: () => Promise<void>;
  onSelectionCleared: () => void;
};

export function ChapterCurationPanel({
  bookId,
  chapters,
  selectedChapterIds,
  onBookChanged,
  onSelectionCleared,
}: ChapterCurationPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [removeChapterId, setRemoveChapterId] = useState<string | null>(null);
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const removedChaptersQuery = useQuery({
    ...booksControllerListRemovedChaptersOptions({ path: { bookId } }),
    enabled: isOpen,
  });
  const updateSelection = useMutation({
    ...booksControllerUpdateChapterSelectionMutation(),
    onSuccess: onBookChanged,
  });
  const createChapter = useMutation({
    ...booksControllerCreateChapterMutation(),
    onSuccess: async () => {
      setIsAddingChapter(false);
      await afterOutlineChange();
    },
  });
  const mergeChapters = useMutation({
    ...booksControllerMergeChaptersMutation(),
    onSuccess: async () => {
      setIsMergeDialogOpen(false);
      await afterOutlineChange();
    },
  });
  const removeChapter = useMutation({
    ...booksControllerRemoveChapterMutation(),
    onSuccess: async () => {
      setRemoveChapterId(null);
      await afterOutlineChange();
    },
  });
  const restoreChapter = useMutation({
    ...booksControllerRestoreChapterMutation(),
    onSuccess: afterOutlineChange,
  });
  const reorderChapters = useMutation({
    ...booksControllerReorderChaptersMutation(),
    onSuccess: afterOutlineChange,
  });
  const createForm = useForm({
    defaultValues: {
      title: '',
      text: '',
      role: 'MAIN' as ChapterRole,
      includeInDefaultNarration: true,
    },
    validators: {
      onChange: chapterCreateSchema,
      onSubmit: chapterCreateSchema,
    },
    onSubmit: ({ value }) => {
      createChapter.mutate({
        path: { bookId },
        body: {
          title: value.title,
          text: value.text,
          role: value.role,
          includeInDefaultNarration: value.includeInDefaultNarration,
        },
      });
    },
  });
  const mergeForm = useForm({
    defaultValues: {
      title: '',
      role: 'MAIN' as ChapterRole,
      includeInDefaultNarration: true,
    },
    validators: {
      onChange: chapterMergeSchema,
      onSubmit: chapterMergeSchema,
    },
    onSubmit: ({ value }) => {
      if (!canMerge) {
        return;
      }

      mergeChapters.mutate({
        path: { bookId },
        body: {
          chapterIds: selectedChapterIds,
          title: value.title,
          role: value.role,
          includeInDefaultNarration: value.includeInDefaultNarration,
          discardAudio: true,
        },
      });
    },
  });
  const selectedChapters = chapters.filter((chapter) =>
    selectedChapterIds.includes(chapter.id),
  );
  const canMerge = areAdjacentChapters(chapters, selectedChapterIds);
  const chapterToRemove = chapters.find(
    (chapter) => chapter.id === removeChapterId,
  );

  async function afterOutlineChange() {
    onSelectionCleared();
    await onBookChanged();
    await removedChaptersQuery.refetch();
  }

  function updateSelectedChapters(change: {
    role?: ChapterRole;
    includeInDefaultNarration?: boolean;
  }) {
    if (selectedChapterIds.length === 0) {
      return;
    }

    updateSelection.mutate({
      path: { bookId },
      body: { chapterIds: selectedChapterIds, ...change },
    });
  }

  function updateOneChapter(
    chapterId: string,
    change: { role?: ChapterRole; includeInDefaultNarration?: boolean },
  ) {
    updateSelection.mutate({
      path: { bookId },
      body: { chapterIds: [chapterId], ...change },
    });
  }

  function moveChapter(chapterId: string, direction: -1 | 1) {
    const currentIndex = chapters.findIndex(
      (chapter) => chapter.id === chapterId,
    );
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= chapters.length) {
      return;
    }

    const orderedIds = chapters.map((chapter) => chapter.id);
    [orderedIds[currentIndex], orderedIds[nextIndex]] = [
      orderedIds[nextIndex],
      orderedIds[currentIndex],
    ];
    reorderChapters.mutate({
      path: { bookId },
      body: { chapterIds: orderedIds },
    });
  }

  function openMergeDialog() {
    const firstChapter = selectedChapters[0];
    if (!firstChapter || !canMerge) {
      return;
    }

    mergeForm.reset({
      title: firstChapter.title,
      role: firstChapter.role,
      includeInDefaultNarration: firstChapter.includeInDefaultNarration,
    });
    setIsMergeDialogOpen(true);
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger
          render={
            <Button type="button" variant="outline">
              <TagsIcon aria-hidden="true" />
              {t('book.reviewChapters')}
            </Button>
          }
        />
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{t('book.reviewChapters')}</SheetTitle>
            <SheetDescription>
              {t('book.reviewChaptersDescription')}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 p-4">
            <section className="rounded-lg border p-3">
              <p className="font-medium">{t('book.selectedChapterActions')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('book.chaptersSelected', {
                  count: selectedChapterIds.length,
                })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Select
                  disabled={
                    selectedChapterIds.length === 0 || updateSelection.isPending
                  }
                  onValueChange={(value) =>
                    updateSelectedChapters({ role: value as ChapterRole })
                  }
                >
                  <SelectTrigger className="min-w-44">
                    <SelectValue placeholder={t('book.setRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    {chapterRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {t(`book.roles.${role}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    selectedChapterIds.length === 0 || updateSelection.isPending
                  }
                  onClick={() =>
                    updateSelectedChapters({ includeInDefaultNarration: true })
                  }
                >
                  {t('book.includeSelected')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    selectedChapterIds.length === 0 || updateSelection.isPending
                  }
                  onClick={() =>
                    updateSelectedChapters({ includeInDefaultNarration: false })
                  }
                >
                  {t('book.excludeSelected')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canMerge || mergeChapters.isPending}
                  onClick={openMergeDialog}
                >
                  <MergeIcon aria-hidden="true" />
                  {t('book.mergeSelected')}
                </Button>
              </div>
              {updateSelection.error && (
                <FieldError className="mt-3">
                  {t(getApiErrorTranslationKey(updateSelection.error))}
                </FieldError>
              )}
            </section>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingChapter(true)}
              >
                <FilePlus2Icon aria-hidden="true" />
                {t('book.addChapter')}
              </Button>
            </div>

            <ol className="space-y-3">
              {chapters.map((chapter, index) => (
                <li key={chapter.id}>
                  <div className="rounded-lg border p-3">
                    <div className="flex gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{chapter.title}</p>
                          <Badge
                            variant={
                              chapter.includeInDefaultNarration
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {t(`book.roles.${chapter.role}`)}
                          </Badge>
                          {chapter.classificationReason && (
                            <Badge variant="outline">
                              {t('book.parserSuggestion')}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t('book.wordCount', { count: chapter.wordCount })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          disabled={index === 0 || reorderChapters.isPending}
                          aria-label={t('book.moveChapterUp', {
                            title: chapter.title,
                          })}
                          onClick={() => moveChapter(chapter.id, -1)}
                        >
                          <ChevronUpIcon aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          disabled={
                            index === chapters.length - 1 ||
                            reorderChapters.isPending
                          }
                          aria-label={t('book.moveChapterDown', {
                            title: chapter.title,
                          })}
                          onClick={() => moveChapter(chapter.id, 1)}
                        >
                          <ChevronDownIcon aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Select
                        value={chapter.role}
                        disabled={updateSelection.isPending}
                        onValueChange={(value) =>
                          updateOneChapter(chapter.id, {
                            role: value as ChapterRole,
                          })
                        }
                      >
                        <SelectTrigger className="min-w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {chapterRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {t(`book.roles.${role}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={chapter.includeInDefaultNarration}
                          disabled={updateSelection.isPending}
                          aria-label={t('book.includeInNarration')}
                          onCheckedChange={(checked) =>
                            updateOneChapter(chapter.id, {
                              includeInDefaultNarration: checked,
                            })
                          }
                        />
                        {t('book.includeInNarration')}
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingChapterId(chapter.id)}
                      >
                        <PencilIcon aria-hidden="true" />
                        {t('book.editChapter')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={isChapterGenerating(chapter)}
                        onClick={() => setRemoveChapterId(chapter.id)}
                      >
                        <Trash2Icon aria-hidden="true" />
                        {t('book.removeChapter')}
                      </Button>
                    </div>
                    {isChapterGenerating(chapter) && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {t('book.stopAudioBeforeEditing')}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            {removedChaptersQuery.data?.chapters.length ? (
              <section className="border-t pt-5">
                <h3 className="font-medium">{t('book.removedChapters')}</h3>
                <div className="mt-3 space-y-2">
                  {removedChaptersQuery.data.chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{chapter.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('book.wordCount', { count: chapter.wordCount })}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={restoreChapter.isPending}
                        onClick={() =>
                          restoreChapter.mutate({
                            path: { bookId, chapterId: chapter.id },
                          })
                        }
                      >
                        {restoreChapter.isPending ? (
                          <LoaderCircleIcon
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <RotateCcwIcon aria-hidden="true" />
                        )}
                        {t('book.restoreChapter')}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <ChapterCurationEditor
        bookId={bookId}
        chapterId={editingChapterId}
        onClose={() => setEditingChapterId(null)}
        onSaved={afterOutlineChange}
      />

      <AlertDialog
        open={removeChapterId !== null}
        onOpenChange={(open) => !open && setRemoveChapterId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('book.removeChapterTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('book.removeChapterDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeChapter.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={!chapterToRemove || removeChapter.isPending}
              onClick={() =>
                chapterToRemove &&
                removeChapter.mutate({
                  path: { bookId, chapterId: chapterToRemove.id },
                  body: { discardAudio: true },
                })
              }
            >
              {removeChapter.isPending && (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              )}
              {t('book.removeChapter')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isAddingChapter} onOpenChange={setIsAddingChapter}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('book.addChapter')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('book.addChapterDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form
            className="space-y-4"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void createForm.handleSubmit();
            }}
          >
            <createForm.Field name="title">
              {(field) => (
                <ChapterFormInput
                  id="new-chapter-title"
                  label={t('book.chapterTitle')}
                  value={field.state.value}
                  disabled={createChapter.isPending}
                  errors={field.state.meta.errors.map((error) =>
                    error ? t(error.message) : '',
                  )}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
              )}
            </createForm.Field>
            <createForm.Field name="text">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="new-chapter-text">
                    {t('book.chapterText')}
                  </Label>
                  <Textarea
                    id="new-chapter-text"
                    className="min-h-40"
                    value={field.state.value}
                    disabled={createChapter.isPending}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  {field.state.meta.errors[0] && (
                    <FieldError>
                      {t(field.state.meta.errors[0].message)}
                    </FieldError>
                  )}
                </div>
              )}
            </createForm.Field>
            {createChapter.error && (
              <FieldError>
                {t(getApiErrorTranslationKey(createChapter.error))}
              </FieldError>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={createChapter.isPending}>
                {t('common.cancel')}
              </AlertDialogCancel>
              <createForm.Subscribe selector={(state) => state.canSubmit}>
                {(canSubmit) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || createChapter.isPending}
                  >
                    {createChapter.isPending && (
                      <LoaderCircleIcon
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    {t('book.addChapter')}
                  </Button>
                )}
              </createForm.Subscribe>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('book.mergeSelected')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('book.mergeChaptersDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form
            className="space-y-4"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void mergeForm.handleSubmit();
            }}
          >
            <mergeForm.Field name="title">
              {(field) => (
                <ChapterFormInput
                  id="merged-chapter-title"
                  label={t('book.chapterTitle')}
                  value={field.state.value}
                  disabled={mergeChapters.isPending}
                  errors={field.state.meta.errors.map((error) =>
                    error ? t(error.message) : '',
                  )}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
              )}
            </mergeForm.Field>
            <mergeForm.Field name="role">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="merged-chapter-role">
                    {t('book.chapterRole')}
                  </Label>
                  <Select
                    value={field.state.value}
                    disabled={mergeChapters.isPending}
                    onValueChange={(value) =>
                      field.handleChange(value as ChapterRole)
                    }
                  >
                    <SelectTrigger id="merged-chapter-role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {chapterRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {t(`book.roles.${role}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </mergeForm.Field>
            <mergeForm.Field name="includeInDefaultNarration">
              {(field) => (
                <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <span className="font-medium">
                    {t('book.includeInNarration')}
                  </span>
                  <Switch
                    checked={field.state.value}
                    disabled={mergeChapters.isPending}
                    onCheckedChange={field.handleChange}
                  />
                </label>
              )}
            </mergeForm.Field>
            {mergeChapters.error && (
              <FieldError>
                {t(getApiErrorTranslationKey(mergeChapters.error))}
              </FieldError>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={mergeChapters.isPending}>
                {t('common.cancel')}
              </AlertDialogCancel>
              <mergeForm.Subscribe selector={(state) => state.canSubmit}>
                {(canSubmit) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || mergeChapters.isPending}
                  >
                    {mergeChapters.isPending && (
                      <LoaderCircleIcon
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    <MergeIcon aria-hidden="true" />
                    {t('book.mergeChapters')}
                  </Button>
                )}
              </mergeForm.Subscribe>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ChapterFormInput({
  id,
  label,
  value,
  disabled,
  errors,
  onBlur,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  errors: string[];
  onBlur: () => void;
  onChange: (value: string) => void;
}) {
  const error = errors[0];

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}
