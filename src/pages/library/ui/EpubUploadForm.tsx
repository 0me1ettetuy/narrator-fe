import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  FileTextIcon,
  FileUpIcon,
  LoaderCircleIcon,
  XIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { booksControllerListBooksQueryKey } from '@/shared/api';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { FieldError } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { uploadEpub } from '../api/upload-epub';
import { epubFileSchema, epubUploadsSchema } from '../model/epub-upload';

type EpubUploadFormProps = {
  onUploaded: () => void;
  onCancel: () => void;
  // Files dropped on the library's add card; invalid ones are ignored.
  initialFiles?: File[];
};

type UploadStatus = 'READY' | 'UPLOADING' | 'QUEUED' | 'FAILED';

type UploadItem = {
  file: File;
  id: string;
  status: UploadStatus;
};

export function EpubUploadForm({
  onUploaded,
  onCancel,
  initialFiles = [],
}: EpubUploadFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const validInitialFiles = initialFiles.filter(
    (file) => epubFileSchema.safeParse(file).success,
  );
  const [items, setItems] = useState<UploadItem[]>(() =>
    validInitialFiles.map((file) => ({
      file,
      id: getFileId(file),
      status: 'READY' as const,
    })),
  );
  const [selectionError, setSelectionError] = useState<string | null>(() =>
    validInitialFiles.length !== initialFiles.length
      ? t('library.invalidFiles')
      : null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: { files: validInitialFiles },
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

      if (hasUploadedBook) {
        await queryClient.invalidateQueries({
          queryKey: booksControllerListBooksQueryKey(),
        });
        // Stay in the uploading state: the dialog closes now, and resetting the
        // button here would flash "Upload 0 books" during its exit animation.
        onUploaded();
        return;
      }

      setIsUploading(false);
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

  function addFiles(selectedFiles: File[]) {
    const validFiles = selectedFiles.filter(
      (file) => epubFileSchema.safeParse(file).success,
    );

    setSelectionError(
      validFiles.length !== selectedFiles.length
        ? t('library.invalidFiles')
        : null,
    );
    setItems((currentItems) => {
      const knownIds = new Set(currentItems.map((item) => item.id));
      const newItems = validFiles
        .filter((file) => !knownIds.has(getFileId(file)))
        .map((file) => ({
          file,
          id: getFileId(file),
          status: 'READY' as const,
        }));
      const nextItems = [...currentItems, ...newItems];

      form.setFieldValue(
        'files',
        nextItems.map((item) => item.file),
      );
      return nextItems;
    });
  }

  return (
    <form
      className="flex min-w-0 flex-col gap-4"
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
          const totalSize = items.reduce(
            (sum, item) => sum + item.file.size,
            0,
          );

          return (
            <>
              <Input
                ref={fileInputRef}
                id="epub-files"
                name={field.name}
                type="file"
                accept=".epub,application/epub+zip"
                multiple
                className="sr-only"
                tabIndex={-1}
                onChange={(event) => {
                  addFiles(Array.from(event.target.files ?? []));
                  event.target.value = '';
                }}
              />
              <div
                className={cn(
                  'flex border-[1.5px] border-dashed text-muted-foreground',
                  items.length === 0
                    ? 'min-h-44 flex-col items-center justify-center gap-2.5 p-4 text-center'
                    : 'items-center gap-3 px-4 py-3',
                  isDragging && 'border-foreground bg-card',
                )}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  addFiles(Array.from(event.dataTransfer.files));
                }}
              >
                <FileUpIcon
                  className={items.length === 0 ? 'size-5' : 'size-4'}
                  aria-hidden="true"
                />
                {items.length === 0 ? (
                  <>
                    <span className="font-serif text-[17px] text-foreground">
                      {t('library.dropTitle')}
                    </span>
                    <span className="text-[13px]">
                      {t('library.fileRequirements')}
                    </span>
                  </>
                ) : (
                  <span className="flex-1 text-[13px]">
                    {t('library.dropMore')}
                  </span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size={items.length === 0 ? 'default' : 'sm'}
                  className={items.length === 0 ? 'mt-1.5' : undefined}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('library.chooseFiles')}
                </Button>
              </div>

              {items.length > 0 && (
                <ul
                  aria-label={t('library.filesToUpload')}
                  className="-mx-5 max-h-64 overflow-y-auto border-b"
                >
                  {items.map((item) => (
                    <UploadQueueRow
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

              <div className="flex flex-wrap items-center justify-end gap-2">
                {items.length > 0 && (
                  <span className="mr-auto text-[13px] text-muted-foreground">
                    {t('library.bookCount', { count: items.length })}
                    {` · ${formatFileSize(totalSize)}`}
                  </span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={onCancel}
                >
                  {t('common.cancel')}
                </Button>
                <Button
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
              </div>
            </>
          );
        }}
      </form.Field>
    </form>
  );
}

function UploadQueueRow({
  item,
  onRemove,
}: {
  item: UploadItem;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const status = getUploadStatus(item.status, t);

  return (
    <li className="grid grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-x-3 border-t px-5 py-3">
      <FileTextIcon
        className={cn(
          'size-4',
          item.status === 'FAILED'
            ? 'text-destructive-text'
            : 'text-muted-foreground',
        )}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium" title={item.file.name}>
          {item.file.name}
        </span>
        <span
          className={cn(
            'text-xs text-muted-foreground',
            item.status === 'FAILED' && 'text-destructive-text',
          )}
        >
          {formatFileSize(item.file.size)} · {status.label}
        </span>
      </div>
      {item.status === 'UPLOADING' ? (
        <LoaderCircleIcon
          className="size-4 animate-spin text-brand"
          aria-label={status.label}
        />
      ) : item.status === 'QUEUED' ? (
        <CheckCircle2Icon className="size-4" aria-label={status.label} />
      ) : item.status === 'FAILED' ? (
        <CircleAlertIcon
          className="size-4 text-destructive-text"
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
          <XIcon aria-hidden="true" />
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
