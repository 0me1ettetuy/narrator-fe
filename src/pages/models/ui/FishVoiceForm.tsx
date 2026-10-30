import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { LoaderCircleIcon, PlusIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getApiErrorTranslationKey,
  ttsModelsControllerAddFishVoiceMutation,
  ttsModelsControllerListModelsQueryKey,
} from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { FieldError } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { fishVoiceSchema } from '../model/fish-voice';

type FishVoiceFormProps = {
  disabled?: boolean;
};

export function FishVoiceForm({ disabled = false }: FishVoiceFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const addVoice = useMutation({
    ...ttsModelsControllerAddFishVoiceMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ttsModelsControllerListModelsQueryKey(),
      });
    },
  });
  const form = useForm({
    defaultValues: { referenceId: '', name: '' },
    validators: {
      onChange: fishVoiceSchema,
      onSubmit: fishVoiceSchema,
    },
    listeners: {
      onChange: () => addVoice.reset(),
    },
    onSubmit: async ({ value }) => {
      const name = value.name.trim();

      await addVoice.mutateAsync({
        body: {
          referenceId: value.referenceId.trim(),
          ...(name ? { name } : {}),
        },
      });
    },
  });

  useEffect(() => {
    if (addVoice.isSuccess) {
      form.reset();
    }
  }, [addVoice.isSuccess, form]);

  const isBusy = disabled || addVoice.isPending;

  return (
    <form
      className="space-y-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto]">
        <form.Field name="referenceId">
          {(field) => {
            const hasError =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <div className="space-y-2">
                <Label htmlFor="fish-voice-reference-id">
                  {t('models.voiceId')}
                </Label>
                <Input
                  id="fish-voice-reference-id"
                  name={field.name}
                  autoComplete="off"
                  placeholder={t('models.voiceIdPlaceholder')}
                  value={field.state.value}
                  aria-invalid={hasError}
                  aria-describedby={
                    hasError ? 'fish-voice-reference-id-error' : undefined
                  }
                  disabled={isBusy}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                {hasError && (
                  <FieldError
                    id="fish-voice-reference-id-error"
                    errors={field.state.meta.errors.map((error) => ({
                      message: error ? t(error.message) : undefined,
                    }))}
                  />
                )}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="name">
          {(field) => {
            const hasError =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <div className="space-y-2">
                <Label htmlFor="fish-voice-name">{t('models.voiceName')}</Label>
                <Input
                  id="fish-voice-name"
                  name={field.name}
                  autoComplete="off"
                  placeholder={t('models.voiceNamePlaceholder')}
                  value={field.state.value}
                  aria-invalid={hasError}
                  aria-describedby={
                    hasError ? 'fish-voice-name-error' : undefined
                  }
                  disabled={isBusy}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                {hasError && (
                  <FieldError
                    id="fish-voice-name-error"
                    errors={field.state.meta.errors.map((error) => ({
                      message: error ? t(error.message) : undefined,
                    }))}
                  />
                )}
              </div>
            );
          }}
        </form.Field>

        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              type="submit"
              className="w-full sm:col-span-2 lg:col-span-1 lg:w-auto lg:self-end"
              disabled={!canSubmit || isSubmitting || isBusy}
            >
              {isSubmitting || addVoice.isPending ? (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              ) : (
                <PlusIcon aria-hidden="true" />
              )}
              {t('models.addVoice')}
            </Button>
          )}
        </form.Subscribe>
      </div>

      {addVoice.error && (
        <FieldError id="fish-voice-add-error">
          {t(getApiErrorTranslationKey(addVoice.error))}
        </FieldError>
      )}
    </form>
  );
}
