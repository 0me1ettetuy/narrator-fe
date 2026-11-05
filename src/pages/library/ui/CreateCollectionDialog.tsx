import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { LoaderCircleIcon } from 'lucide-react';
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
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b p-5 pr-12">
          <DialogTitle>{t('collection.create')}</DialogTitle>
          <DialogDescription>
            {t('collection.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4 p-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field name="title">
            {(field) => {
              const hasError =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <div className="space-y-2">
                  <Label htmlFor="collection-title">
                    {t('collection.titleLabel')}
                  </Label>
                  <Input
                    id="collection-title"
                    name={field.name}
                    value={field.state.value}
                    aria-invalid={hasError}
                    aria-describedby={
                      hasError ? 'collection-title-error' : undefined
                    }
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
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
                  <Label htmlFor="collection-description">
                    {t('collection.descriptionLabel')}
                  </Label>
                  <Textarea
                    id="collection-description"
                    name={field.name}
                    value={field.state.value}
                    aria-invalid={hasError}
                    aria-describedby={
                      hasError ? 'collection-description-error' : undefined
                    }
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
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
          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {t(getApiErrorTranslationKeyForCode(serverError))}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={createCollection.isPending}>
              {createCollection.isPending && (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
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
