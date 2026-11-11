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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { FieldError } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription>
            {hasCover
              ? t('book.changeCoverDescription')
              : t('book.addCoverDescription')}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex min-w-0 flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field name="file">
            {(field) => (
              <>
                <Input
                  ref={fileInputRef}
                  id="book-cover-file"
                  name={field.name}
                  type="file"
                  accept={BOOK_COVER_MIME_TYPES.join(',')}
                  className="sr-only"
                  tabIndex={-1}
                  disabled={uploadCover.isPending}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    field.handleChange(file);
                    setPreviewFile(file);
                    event.target.value = '';
                  }}
                />
                <div className="flex items-start gap-4">
                  <span
                    className="flex aspect-2/3 w-28 shrink-0 items-center justify-center overflow-hidden bg-secondary text-muted-foreground"
                    aria-hidden={previewUrl ? undefined : true}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={t('book.coverPreviewAlt', { title: bookTitle })}
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImageIcon aria-hidden="true" />
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                    {selectedFile ? (
                      <>
                        <span
                          className="max-w-full truncate text-sm font-medium"
                          title={selectedFile.name}
                        >
                          {selectedFile.name}
                        </span>
                        <span className="text-[13px] text-muted-foreground">
                          {formatFileSize(selectedFile.size)} ·{' '}
                          {t('book.coverReadyToSave')}
                        </span>
                      </>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">
                        {t('book.coverFileRequirements')}
                      </span>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadCover.isPending}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageUpIcon aria-hidden="true" />
                        {t('book.chooseCover')}
                      </Button>
                      {selectedFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
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
                          {t('common.remove')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <FieldError
                  errors={field.state.meta.errors.map((error) => ({
                    message: t(error?.message ?? 'errors.validation'),
                  }))}
                />
              </>
            )}
          </form.Field>

          {uploadCover.error ? (
            <p className="text-sm text-destructive-text" role="alert">
              {t(getApiErrorTranslationKey(uploadCover.error))}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={uploadCover.isPending}
              onClick={() => handleOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={uploadCover.isPending || selectedFile === null}
            >
              {uploadCover.isPending && (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              )}
              {uploadCover.isPending
                ? t('book.coverSaving')
                : t('book.saveCover')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatFileSize(sizeInBytes: number) {
  const sizeInMegabytes = sizeInBytes / (1024 * 1024);

  return `${sizeInMegabytes < 1 ? sizeInMegabytes.toFixed(1) : Math.round(sizeInMegabytes)} MB`;
}
