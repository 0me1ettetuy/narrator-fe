import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  FileTextIcon,
  FileUpIcon,
  LoaderCircleIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { booksControllerListBooksQueryKey } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { FieldError } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { uploadEpub } from '../api/upload-epub';
import { epubFileSchema, epubUploadsSchema } from '../model/epub-upload';

type EpubUploadFormProps = {
  onUploaded: () => void;
};

type UploadStatus = 'READY' | 'UPLOADING' | 'QUEUED' | 'FAILED';

type UploadItem = {
  file: File;
  id: string;
  status: UploadStatus;
};

export function EpubUploadForm({ onUploaded }: EpubUploadFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm({
    defaultValues: { files: [] as File[] },
    validators: { onSubmit: epubUploadsSchema },
    onSubmit: async () => {
      const uploadableItems = items.filter(
        (item) => item.status === 'READY' || item.status === 'FAILED',
      );

      if (uploadableItems.length === 0) {
        return;
      }

      setIsUploading(true);
      let hasUploadedBook = false;

      for (const item of uploadableItems) {
        setItemStatus(item.id, 'UPLOADING');

        try {
          await uploadEpub(item.file);
          setItemStatus(item.id, 'QUEUED');
          hasUploadedBook = true;
        } catch {
          setItemStatus(item.id, 'FAILED');
        }
      }

      setIsUploading(false);

      if (hasUploadedBook) {
        await queryClient.invalidateQueries({
          queryKey: booksControllerListBooksQueryKey(),
        });
        onUploaded();
      }
    },
  });

  function setItemStatus(id: string, status: UploadStatus) {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  }

  function getFileId(file: File) {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  return (
    <form
      className="min-w-0 space-y-5 p-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      aria-describedby={selectionError ? 'epub-upload-error' : undefined}
    >
      <form.Field name="files">
        {(field) => {
          const uploadableCount = items.filter(
            (item) => item.status === 'READY' || item.status === 'FAILED',
          ).length;

          return (
            <>
              <div className="space-y-3">
                <Input
                  id="epub-files"
                  name={field.name}
                  type="file"
                  accept=".epub,application/epub+zip"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    const selectedFiles = Array.from(event.target.files ?? []);
                    const validFiles = selectedFiles.filter(
                      (file) => epubFileSchema.safeParse(file).success,
                    );
                    const hasInvalidFile =
                      validFiles.length !== selectedFiles.length;

                    setSelectionError(
                      hasInvalidFile ? t('library.invalidFiles') : null,
                    );
                    setItems((currentItems) => {
                      const knownIds = new Set(
                        currentItems.map((item) => item.id),
                      );
                      const newItems = validFiles
                        .filter((file) => !knownIds.has(getFileId(file)))
                        .map((file) => ({
                          file,
                          id: getFileId(file),
                          status: 'READY' as const,
                        }));
                      const nextItems = [...currentItems, ...newItems];

                      field.handleChange(nextItems.map((item) => item.file));
                      return nextItems;
                    });
                    event.target.value = '';
                  }}
                />
                <Label
                  htmlFor="epub-files"
                  className="group flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-4 py-5 text-center transition-colors hover:border-foreground/35 hover:bg-muted/60 has-[:focus-visible]:border-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50"
                >
                  <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-background ring-1 ring-foreground/10 transition-transform group-hover:scale-105">
                    <FileUpIcon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-medium">{t('library.addFiles')}</span>
                  <span className="mt-1 text-sm font-normal text-muted-foreground">
                    {t('library.fileRequirements')}
                  </span>
                </Label>
              </div>

              {items.length > 0 && (
                <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <UploadQueueCard
                      key={item.id}
                      item={item}
                      onRemove={() => {
                        if (item.status === 'UPLOADING') {
                          return;
                        }

                        setItems((currentItems) => {
                          const nextItems = currentItems.filter(
                            (currentItem) => currentItem.id !== item.id,
                          );
                          field.handleChange(
                            nextItems.map((currentItem) => currentItem.file),
                          );
                          return nextItems;
                        });
                      }}
                    />
                  ))}
                </ul>
              )}

              {selectionError && (
                <FieldError id="epub-upload-error">{selectionError}</FieldError>
              )}

              <Button
                className="w-full"
                type="submit"
                disabled={uploadableCount === 0 || isUploading}
              >
                {isUploading ? (
                  <LoaderCircleIcon
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <FileUpIcon aria-hidden="true" />
                )}
                {isUploading
                  ? t('library.uploading')
                  : t('library.uploadBooks', { count: uploadableCount })}
              </Button>
            </>
          );
        }}
      </form.Field>
    </form>
  );
}

function UploadQueueCard({
  item,
  onRemove,
}: {
  item: UploadItem;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const status = getUploadStatus(item.status, t);

  return (
    <li className="flex min-w-0 items-center gap-3 rounded-xl border bg-muted/30 p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background ring-1 ring-foreground/10">
        <FileTextIcon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={item.file.name}>
          {item.file.name}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatFileSize(item.file.size)} · {status.label}
        </p>
      </div>
      {item.status === 'UPLOADING' ? (
        <LoaderCircleIcon
          className="size-4 shrink-0 animate-spin text-muted-foreground"
          aria-label={status.label}
        />
      ) : item.status === 'QUEUED' ? (
        <CheckCircle2Icon
          className="size-4 shrink-0 text-primary"
          aria-label={status.label}
        />
      ) : item.status === 'FAILED' ? (
        <CircleAlertIcon
          className="size-4 shrink-0 text-destructive"
          aria-label={status.label}
        />
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          onClick={onRemove}
          aria-label={t('library.removeFile', { name: item.file.name })}
        >
          <Trash2Icon aria-hidden="true" />
        </Button>
      )}
    </li>
  );
}

function getUploadStatus(
  status: UploadStatus,
  t: ReturnType<typeof useTranslation>['t'],
) {
  switch (status) {
    case 'READY':
      return { label: t('library.readyToUpload') };
    case 'UPLOADING':
      return { label: t('library.statusUploading') };
    case 'QUEUED':
      return { label: t('library.statusQueued') };
    case 'FAILED':
      return { label: t('library.statusFailed') };
  }
}

function formatFileSize(sizeInBytes: number) {
  const sizeInMegabytes = sizeInBytes / (1024 * 1024);

  return `${sizeInMegabytes < 1 ? sizeInMegabytes.toFixed(1) : Math.round(sizeInMegabytes)} MB`;
}
