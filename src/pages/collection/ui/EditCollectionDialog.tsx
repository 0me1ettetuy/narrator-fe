import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon, PencilIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  collectionsControllerGetCollectionQueryKey,
  collectionsControllerListCollectionsQueryKey,
  collectionsControllerListPublicCollectionsQueryKey,
  collectionsControllerUpdateCollectionMutation,
  getApiErrorCode,
  getApiErrorTranslationKeyForCode,
  type ApiErrorCode,
  type CollectionSummaryResponseDto,
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
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

// Same rules as the create form. Pages can't import each other, so this is a copy.
const collectionFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: 'collection.titleRequired', abort: true })
    .max(200, { error: 'collection.titleTooLong' }),
  description: z
    .string()
    .trim()
    .max(1000, { error: 'collection.descriptionTooLong' }),
});

type EditCollectionDialogProps = {
  collection: CollectionSummaryResponseDto;
};

export function EditCollectionDialog({
  collection,
}: EditCollectionDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<ApiErrorCode | null>(null);
  const updateCollection = useMutation(
    collectionsControllerUpdateCollectionMutation(),
  );

  const form = useForm({
    defaultValues: {
      title: collection.title,
      description: collection.description ?? '',
    },
    validators: {
      onChange: collectionFormSchema,
      onSubmit: collectionFormSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      try {
        await updateCollection.mutateAsync({
          path: { collectionId: collection.id },
          body: {
            title: value.title,
            description: value.description || null,
          },
        });
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: collectionsControllerGetCollectionQueryKey({
              path: { collectionId: collection.id },
            }),
          }),
          queryClient.invalidateQueries({
            queryKey: collectionsControllerListCollectionsQueryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: collectionsControllerListPublicCollectionsQueryKey(),
          }),
        ]);
        setIsOpen(false);
      } catch (error) {
        setServerError(getApiErrorCode(error));
      }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <PencilIcon aria-hidden="true" />
            {t('collection.edit')}
          </Button>
        }
      />
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b p-5 pr-12">
          <DialogTitle>{t('collection.edit')}</DialogTitle>
          <DialogDescription>{collection.title}</DialogDescription>
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
                  <Label htmlFor="edit-collection-title">
                    {t('collection.titleLabel')}
                  </Label>
                  <Input
                    id="edit-collection-title"
                    name={field.name}
                    value={field.state.value}
                    aria-invalid={hasError}
                    aria-describedby={
                      hasError ? 'edit-collection-title-error' : undefined
                    }
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  {hasError && (
                    <FieldError
                      id="edit-collection-title-error"
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
                  <Label htmlFor="edit-collection-description">
                    {t('collection.descriptionLabel')}
                  </Label>
                  <Textarea
                    id="edit-collection-description"
                    name={field.name}
                    value={field.state.value}
                    aria-invalid={hasError}
                    aria-describedby={
                      hasError ? 'edit-collection-description-error' : undefined
                    }
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  {hasError && (
                    <FieldError
                      id="edit-collection-description-error"
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
            <Button type="submit" disabled={updateCollection.isPending}>
              {updateCollection.isPending && (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              )}
              {updateCollection.isPending
                ? t('collection.saving')
                : t('collection.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
