import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LoaderCircleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetChapterOptions,
  booksControllerUpdateChapterMutation,
  getApiErrorTranslationKey,
  type ChapterDetailResponseDto,
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { Switch } from '@/shared/ui/switch';
import { Textarea } from '@/shared/ui/textarea';
import {
  chapterEditorSchema,
  chapterRoles,
  type ChapterRole,
} from '../model/chapter-curation';

type ChapterCurationEditorProps = {
  bookId: string;
  chapterId: string | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

type ChapterEditorValues = {
  title: string;
  text: string;
  role: ChapterRole;
  includeInDefaultNarration: boolean;
};

export function ChapterCurationEditor({
  bookId,
  chapterId,
  onClose,
  onSaved,
}: ChapterCurationEditorProps) {
  const { t } = useTranslation();
  const [pendingAudioConfirmation, setPendingAudioConfirmation] =
    useState<ChapterEditorValues | null>(null);
  const chapterQuery = useQuery({
    ...booksControllerGetChapterOptions({
      path: { bookId, chapterId: chapterId ?? '' },
    }),
    enabled: chapterId !== null,
  });
  const updateChapter = useMutation({
    ...booksControllerUpdateChapterMutation(),
    onSuccess: async () => {
      setPendingAudioConfirmation(null);
      await onSaved();
      onClose();
    },
  });
  const form = useForm({
    defaultValues: emptyChapterEditorValues,
    validators: {
      onChange: chapterEditorSchema,
      onSubmit: chapterEditorSchema,
    },
    onSubmit: ({ value }) => {
      const chapter = chapterQuery.data;

      if (!chapter || !chapterId) {
        return;
      }

      if (chapter.audio && chapter.text !== value.text) {
        setPendingAudioConfirmation(value);
        return;
      }

      updateChapter.mutate({
        path: { bookId, chapterId },
        body: value,
      });
    },
  });

  useEffect(() => {
    if (chapterQuery.data) {
      form.reset(toEditorValues(chapterQuery.data));
    }
  }, [chapterQuery.data, form]);

  function confirmAudioDiscard() {
    if (!pendingAudioConfirmation || !chapterId) {
      return;
    }

    updateChapter.mutate({
      path: { bookId, chapterId },
      body: { ...pendingAudioConfirmation, discardAudio: true },
    });
  }

  return (
    <>
      <Sheet
        open={chapterId !== null}
        onOpenChange={(open) => {
          if (!open && !updateChapter.isPending) {
            onClose();
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{t('book.editChapter')}</SheetTitle>
            <SheetDescription>
              {t('book.editChapterDescription')}
            </SheetDescription>
          </SheetHeader>

          {chapterQuery.isPending ? (
            <p className="px-4 text-sm text-muted-foreground">
              {t('book.loadingChapter')}
            </p>
          ) : chapterQuery.isError || !chapterQuery.data ? (
            <div className="space-y-3 px-4">
              <p className="text-sm text-destructive" role="alert">
                {t(getApiErrorTranslationKey(chapterQuery.error))}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => chapterQuery.refetch()}
              >
                {t('common.retry')}
              </Button>
            </div>
          ) : (
            <form
              className="space-y-5 px-4 pb-4"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void form.handleSubmit();
              }}
            >
              <form.Field name="title">
                {(field) => (
                  <ChapterTextField
                    id="chapter-title"
                    label={t('book.chapterTitle')}
                    value={field.state.value}
                    disabled={updateChapter.isPending}
                    error={
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? field.state.meta.errors.map((error) =>
                            error ? t(error.message) : '',
                          )
                        : []
                    }
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                  />
                )}
              </form.Field>

              <form.Field name="text">
                {(field) => {
                  const hasError =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="chapter-text">
                          {t('book.chapterText')}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {t('book.wordCount', {
                            count: countWords(field.state.value),
                          })}
                        </span>
                      </div>
                      <Textarea
                        id="chapter-text"
                        name={field.name}
                        className="min-h-72 resize-y"
                        value={field.state.value}
                        disabled={updateChapter.isPending}
                        aria-invalid={hasError}
                        aria-describedby={
                          hasError ? 'chapter-text-error' : undefined
                        }
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                      {hasError && (
                        <FieldError
                          id="chapter-text-error"
                          errors={field.state.meta.errors.map((error) => ({
                            message: error ? t(error.message) : undefined,
                          }))}
                        />
                      )}
                    </div>
                  );
                }}
              </form.Field>

              <form.Field name="role">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="chapter-role">
                      {t('book.chapterRole')}
                    </Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as ChapterRole)
                      }
                      disabled={updateChapter.isPending}
                    >
                      <SelectTrigger id="chapter-role" className="w-full">
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
              </form.Field>

              <form.Field name="includeInDefaultNarration">
                {(field) => (
                  <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <span>
                      <span className="block font-medium">
                        {t('book.includeInNarration')}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {t('book.includeInNarrationDescription')}
                      </span>
                    </span>
                    <Switch
                      checked={field.state.value}
                      disabled={updateChapter.isPending}
                      aria-label={t('book.includeInNarration')}
                      onCheckedChange={field.handleChange}
                    />
                  </label>
                )}
              </form.Field>

              {chapterQuery.data.classificationReason && (
                <p className="text-sm text-muted-foreground">
                  {t('book.parserSuggestion')}:{' '}
                  {t(getRoleTranslationKey(chapterQuery.data.role))}
                </p>
              )}

              {updateChapter.error && (
                <FieldError>
                  {t(getApiErrorTranslationKey(updateChapter.error))}
                </FieldError>
              )}

              <SheetFooter className="p-0">
                <Button
                  type="button"
                  variant="outline"
                  disabled={updateChapter.isPending}
                  onClick={onClose}
                >
                  {t('common.cancel')}
                </Button>
                <form.Subscribe selector={(state) => state.canSubmit}>
                  {(canSubmit) => (
                    <Button
                      type="submit"
                      disabled={!canSubmit || updateChapter.isPending}
                    >
                      {updateChapter.isPending && (
                        <LoaderCircleIcon
                          className="animate-spin"
                          aria-hidden="true"
                        />
                      )}
                      {t('book.saveChapter')}
                    </Button>
                  )}
                </form.Subscribe>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={pendingAudioConfirmation !== null}
        onOpenChange={(open) => {
          if (!open && !updateChapter.isPending) {
            setPendingAudioConfirmation(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('book.discardAudioTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('book.discardAudioDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateChapter.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={updateChapter.isPending}
              onClick={confirmAudioDiscard}
            >
              {updateChapter.isPending && (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              )}
              {t('book.discardAudioAndSave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ChapterTextField({
  id,
  label,
  value,
  disabled,
  error,
  onBlur,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  error: string[];
  onBlur: () => void;
  onChange: (value: string) => void;
}) {
  const hasError = error.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
      {hasError && <FieldError id={`${id}-error`}>{error[0]}</FieldError>}
    </div>
  );
}

const emptyChapterEditorValues: ChapterEditorValues = {
  title: '',
  text: '',
  role: 'MAIN',
  includeInDefaultNarration: true,
};

function toEditorValues(
  chapter: ChapterDetailResponseDto,
): ChapterEditorValues {
  return {
    title: chapter.title,
    text: chapter.text,
    role: chapter.role,
    includeInDefaultNarration: chapter.includeInDefaultNarration,
  };
}

function getRoleTranslationKey(role: ChapterRole): `book.roles.${ChapterRole}` {
  return `book.roles.${role}`;
}

function countWords(text: string): number {
  const normalizedText = text.trim();

  return normalizedText ? normalizedText.split(/\s+/u).length : 0;
}
