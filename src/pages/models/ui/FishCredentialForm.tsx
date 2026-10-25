import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { KeyRoundIcon, LoaderCircleIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getApiErrorTranslationKey,
  ttsModelsControllerListModelsQueryKey,
  ttsModelsControllerSaveFishCredentialMutation,
  type FishCredentialResponseDto,
} from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { FieldError } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { fishCredentialSchema } from '../model/fish-credential';

type FishCredentialFormProps = {
  credentialState: FishCredentialResponseDto['credentialState'];
};

export function FishCredentialForm({
  credentialState,
}: FishCredentialFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const saveCredential = useMutation({
    ...ttsModelsControllerSaveFishCredentialMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ttsModelsControllerListModelsQueryKey(),
      });
    },
  });
  const form = useForm({
    defaultValues: { apiKey: '' },
    validators: {
      onChange: fishCredentialSchema,
      onSubmit: fishCredentialSchema,
    },
    listeners: {
      onChange: () => saveCredential.reset(),
    },
    onSubmit: async ({ value }) => {
      await saveCredential.mutateAsync({ body: { apiKey: value.apiKey } });
    },
  });

  // An API key must not remain in form state after it has been submitted.
  useEffect(() => {
    if (saveCredential.isSuccess || saveCredential.isError) {
      form.reset();
    }
  }, [form, saveCredential.isError, saveCredential.isSuccess]);

  const describedBy = [
    credentialState !== 'MISSING' ? 'fish-credential-state' : undefined,
    saveCredential.error ? 'fish-credential-error' : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      aria-describedby={describedBy || undefined}
    >
      <form.Field name="apiKey">
        {(field) => {
          const hasError =
            field.state.meta.isTouched && !field.state.meta.isValid;

          return (
            <div className="space-y-2">
              <Label htmlFor="fish-api-key">{t('models.apiKey')}</Label>
              <Input
                id="fish-api-key"
                name={field.name}
                type="password"
                autoComplete="off"
                placeholder={t('models.apiKeyPlaceholder')}
                value={field.state.value}
                aria-invalid={hasError}
                aria-describedby={hasError ? 'fish-api-key-error' : undefined}
                disabled={saveCredential.isPending}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {hasError && (
                <FieldError
                  id="fish-api-key-error"
                  errors={field.state.meta.errors.map((error) => ({
                    message: error ? t(error.message) : undefined,
                  }))}
                />
              )}
            </div>
          );
        }}
      </form.Field>

      {credentialState === 'INVALID' && (
        <p id="fish-credential-state" className="text-sm text-destructive">
          {t('models.invalidCredential')}
        </p>
      )}
      {credentialState === 'UNKNOWN' && (
        <p id="fish-credential-state" className="text-sm text-muted-foreground">
          {t('models.unknownCredential')}
        </p>
      )}
      {saveCredential.error && (
        <FieldError id="fish-credential-error">
          {t(getApiErrorTranslationKey(saveCredential.error))}
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
            type="submit"
            disabled={!canSubmit || isSubmitting || saveCredential.isPending}
          >
            {isSubmitting || saveCredential.isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : (
              <KeyRoundIcon aria-hidden="true" />
            )}
            {isSubmitting || saveCredential.isPending
              ? t('models.verifyingKey')
              : t('models.saveKey')}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
