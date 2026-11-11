import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { FolderPlusIcon, LoaderCircleIcon, LockIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collectionsControllerCreateCollectionMutation,
  collectionsControllerListCollectionsQueryKey,
  getApiErrorCode,
  getApiErrorTranslationKeyForCode,
  type ApiErrorCode,
} from '@/shared/api';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { FieldError } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { collectionFormSchema } from '../model/collection-form';

type CreateCollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateCollectionDialog({
  open,
  onOpenChange,
}: CreateCollectionDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createCollection = useMutation(
    collectionsControllerCreateCollectionMutation(),
  );
  const [serverError, setServerError] = useState<ApiErrorCode | null>(null);

  const form = useForm({
    defaultValues: { title: '', description: '' },
    validators: {
      onChange: collectionFormSchema,
      onSubmit: collectionFormSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      try {
        const collection = await createCollection.mutateAsync({
          body: {
            title: value.title,
            description: value.description || undefined,
          },
        });

        await queryClient.invalidateQueries({
          queryKey: collectionsControllerListCollectionsQueryKey(),
        });
        form.reset();
        onOpenChange(false);
        await navigate({
          to: '/library/collections/$collectionId',
          params: { collectionId: collection.id },
        });
      } catch (error) {
        setServerError(getApiErrorCode(error));
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('collection.create')}</DialogTitle>
          <DialogDescription>
            {t('collection.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div className="flex flex-col gap-5">
            <form.Field name="title">
              {(field) => {
                const hasError =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="collection-title">
                        {t('collection.titleLabel')}
                      </Label>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {field.state.value.length} / 200
                      </span>
                    </div>
                    <Input
                      id="collection-title"
                      name={field.name}
                      value={field.state.value}
                      aria-invalid={hasError}
                      aria-describedby={
                        hasError ? 'collection-title-error' : undefined
                      }
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    {hasError && (
                      <FieldError
                        id="collection-title-error"
                        errors={field.state.meta.errors.map((error) => ({
                          message: error ? t(error.message) : undefined,
                        }))}
                      />
                    )}
                  </div>
                );
              }}
            </form.Field>
            <form.Field name="description">
              {(field) => {
                const hasError =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="collection-description">
                        {t('collection.descriptionLabel')}
                      </Label>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {field.state.value.length} / 1000
                      </span>
                    </div>
                    <Textarea
                      id="collection-description"
                      name={field.name}
                      value={field.state.value}
                      aria-invalid={hasError}
                      aria-describedby={
                        hasError ? 'collection-description-error' : undefined
                      }
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    {hasError && (
                      <FieldError
                        id="collection-description-error"
                        errors={field.state.meta.errors.map((error) => ({
                          message: error ? t(error.message) : undefined,
                        }))}
                      />
                    )}
                  </div>
                );
              }}
            </form.Field>
            <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <LockIcon className="size-3.5" aria-hidden="true" />
              {t('collection.startsPrivate')}
            </p>
          </div>
          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {t(getApiErrorTranslationKeyForCode(serverError))}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createCollection.isPending}>
              {createCollection.isPending ? (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              ) : (
                <FolderPlusIcon aria-hidden="true" />
              )}
              {createCollection.isPending
                ? t('collection.creating')
                : t('collection.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
