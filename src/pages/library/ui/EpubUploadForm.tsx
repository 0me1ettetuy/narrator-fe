import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { booksControllerListBooksQueryKey } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { FieldError } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { uploadEpub } from '../api/upload-epub';
import { epubUploadSchema } from '../model/epub-upload';

type EpubUploadFormProps = {
  onUploaded: () => void;
};

export function EpubUploadForm({ onUploaded }: EpubUploadFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const upload = useMutation({ mutationFn: uploadEpub });
  const [hasServerError, setHasServerError] = useState(false);

  const form = useForm({
    defaultValues: {
      file: null as File | null,
    },
    validators: {
      onChange: epubUploadSchema,
      onSubmit: epubUploadSchema,
    },
    listeners: {
      onChange: () => setHasServerError(false),
    },
    onSubmit: async ({ value }) => {
      if (!value.file) {
        return;
      }

      setHasServerError(false);

      try {
        await upload.mutateAsync(value.file);
        await queryClient.invalidateQueries({
          queryKey: booksControllerListBooksQueryKey(),
        });
        onUploaded();
      } catch {
        setHasServerError(true);
      }
    },
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      aria-describedby={hasServerError ? 'epub-upload-error' : undefined}
    >
      <form.Field name="file">
        {(field) => {
          const hasValidationError =
            field.state.meta.isTouched && !field.state.meta.isValid;

          return (
            <div className="space-y-2">
              <Label htmlFor="epub-file">{t('library.epubFile')}</Label>
              <Input
                id="epub-file"
                name={field.name}
                type="file"
                accept=".epub,application/epub+zip"
                aria-invalid={hasValidationError}
                aria-describedby={
                  hasValidationError ? 'epub-file-error' : undefined
                }
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(event.target.files?.item(0) ?? null);
                }}
              />
              {field.state.value && (
                <p className="text-sm text-muted-foreground">
                  {t('library.selectedFile', {
                    name: field.state.value.name,
                  })}
                </p>
              )}
              {hasValidationError && (
                <FieldError
                  id="epub-file-error"
                  errors={field.state.meta.errors.map((error) => ({
                    message: error ? t(error.message) : undefined,
                  }))}
                />
              )}
            </div>
          );
        }}
      </form.Field>
      {hasServerError && (
        <FieldError id="epub-upload-error">
          {t('library.uploadFailed')}
        </FieldError>
      )}
      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ canSubmit, isSubmitting }) => (
          <Button
            className="w-full"
            type="submit"
            disabled={!canSubmit || isSubmitting || upload.isPending}
          >
            {isSubmitting || upload.isPending
              ? t('library.uploading')
              : t('library.upload')}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
