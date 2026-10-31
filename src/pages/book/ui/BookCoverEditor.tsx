import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ImageIcon,
  ImageUpIcon,
  LoaderCircleIcon,
  PencilIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetBookCoverAccessQueryKey,
  booksControllerGetBookQueryKey,
  booksControllerListBooksQueryKey,
  getApiErrorTranslationKey,
} from '@/shared/api';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { FieldError } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { uploadBookCover } from '../api/upload-book-cover';
import {
  BOOK_COVER_MIME_TYPES,
  bookCoverUploadSchema,
} from '../model/cover-upload';

type BookCoverEditorProps = {
  bookId: string;
  bookTitle: string;
  disabled: boolean;
  hasCover: boolean;
  className?: string;
};

export function BookCoverEditor({
  bookId,
  bookTitle,
  disabled,
  hasCover,
  className,
}: BookCoverEditorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const uploadCover = useMutation({
    mutationFn: (file: File) => uploadBookCover(bookId, file),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: booksControllerGetBookQueryKey({ path: { bookId } }),
        }),
        queryClient.invalidateQueries({
          queryKey: booksControllerGetBookCoverAccessQueryKey({
            path: { bookId },
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: booksControllerListBooksQueryKey(),
        }),
      ]);
    },
  });
  const form = useForm({
    defaultValues: { file: null as File | null },
    validators: { onSubmit: bookCoverUploadSchema },
    onSubmit: async ({ value }) => {
      if (!value.file) {
        return;
      }

      await uploadCover.mutateAsync(value.file);
      form.reset();
      clearPreviewUrl();
      setOpen(false);
    },
  });
  const selectedFile = form.state.values.file;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const actionLabel = hasCover ? t('book.changeCover') : t('book.addCover');

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function setPreviewFile(file: File | null) {
    clearPreviewUrl();

    if (!file) {
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
  }

  function clearPreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewUrl(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen && !uploadCover.isPending) {
      uploadCover.reset();
      form.reset();
      clearPreviewUrl();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <DialogTrigger
          render={
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  className={className}
                  disabled={disabled}
                  aria-label={actionLabel}
                />
              }
            />
          }
        >
          <PencilIcon aria-hidden="true" />
          <span className="sr-only">{actionLabel}</span>
        </DialogTrigger>
        <TooltipContent side="top">{actionLabel}</TooltipContent>
      </Tooltip>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b p-5 pr-12">
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription>
            {hasCover
              ? t('book.changeCoverDescription')
              : t('book.addCoverDescription')}
          </DialogDescription>
        </DialogHeader>
        <form
          className="min-w-0 space-y-5 p-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field name="file">
            {(field) => (
              <>
                <div className="space-y-3">
                  <Input
                    id="book-cover-file"
                    name={field.name}
                    type="file"
                    accept={BOOK_COVER_MIME_TYPES.join(',')}
                    className="sr-only"
                    disabled={uploadCover.isPending}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      field.handleChange(file);
                      setPreviewFile(file);
                      event.target.value = '';
                    }}
                  />
                  <Label
                    htmlFor="book-cover-file"
                    className="group flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-4 py-5 text-center transition-colors hover:border-foreground/35 hover:bg-muted/60 has-[:focus-visible]:border-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50"
                  >
                    <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-background ring-1 ring-foreground/10 transition-transform group-hover:scale-105">
                      <ImageUpIcon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-medium">{t('book.chooseCover')}</span>
                    <span className="mt-1 text-sm font-normal text-muted-foreground">
                      {t('book.coverFileRequirements')}
                    </span>
                  </Label>
                </div>

                {selectedFile ? (
                  <div className="flex min-w-0 items-center gap-3 rounded-xl border bg-muted/30 p-3">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={t('book.coverPreviewAlt', { title: bookTitle })}
                        className="size-9 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
                      />
                    ) : (
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background ring-1 ring-foreground/10">
                        <ImageIcon className="size-4" aria-hidden="true" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-medium"
                        title={selectedFile.name}
                      >
                        {selectedFile.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)} ·{' '}
                        {t('book.coverReadyToSave')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      type="button"
                      disabled={uploadCover.isPending}
                      aria-label={t('book.removeCoverFile', {
                        name: selectedFile.name,
                      })}
                      onClick={() => {
                        field.handleChange(null);
                        clearPreviewUrl();
                      }}
                    >
                      <XIcon aria-hidden="true" />
                    </Button>
                  </div>
                ) : null}

                <FieldError
                  errors={field.state.meta.errors.map((error) => ({
                    message: t(error?.message ?? 'errors.validation'),
                  }))}
                />
              </>
            )}
          </form.Field>

          {uploadCover.error ? (
            <p className="text-sm text-destructive" role="alert">
              {t(getApiErrorTranslationKey(uploadCover.error))}
            </p>
          ) : null}

          <Button
            className="w-full"
            type="submit"
            disabled={uploadCover.isPending || selectedFile === null}
          >
            {uploadCover.isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : (
              <ImageUpIcon aria-hidden="true" />
            )}
            {uploadCover.isPending
              ? t('book.coverSaving')
              : t('book.saveCover')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatFileSize(sizeInBytes: number) {
  const sizeInMegabytes = sizeInBytes / (1024 * 1024);

  return `${sizeInMegabytes < 1 ? sizeInMegabytes.toFixed(1) : Math.round(sizeInMegabytes)} MB`;
}
