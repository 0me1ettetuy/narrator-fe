import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getApiErrorCode,
  getApiErrorTranslationKeyForCode,
  type ApiErrorCode,
} from '@/shared/api';
import { registerMutationOptions } from '@/shared/auth';
import { AuthAside } from '@/widgets/auth-aside';
import { Button } from '@/shared/ui/button';
import { FieldError } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { PasswordInput } from '@/shared/ui/password-input';
import { toast } from '@/shared/ui/toast';
import { registerSchema } from '../model/register';

export function RegisterPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const register = useMutation(registerMutationOptions(queryClient));
  const [serverError, setServerError] = useState<ApiErrorCode | null>(null);
  const hasEmailError = serverError === 'EMAIL_ALREADY_REGISTERED';
  const hasFormError = serverError !== null && !hasEmailError;
  const { t } = useTranslation();

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      passwordConfirmation: '',
    },
    validators: {
      onMount: registerSchema,
      onChange: registerSchema,
      onSubmit: registerSchema,
    },
    listeners: {
      onChange: () => setServerError(null),
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      try {
        await register.mutateAsync({
          body: { email: value.email, password: value.password },
        });
        toast.add({
          title: t('notifications.accountCreated'),
          type: 'success',
        });
        await navigate({ to: '/home' });
      } catch (error) {
        setServerError(getApiErrorCode(error));
      }
    },
  });

  return (
    <main className="flex flex-1 gap-4 p-4">
      <AuthAside variant="register" />
      <section className="flex min-w-0 flex-1 items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <header className="flex flex-col gap-2">
            <h1 className="text-[32px] leading-[1.1] font-medium tracking-[-0.02em]">
              {t('auth.createAccountTitle')}
            </h1>
            <p className="font-serif text-sm text-muted-foreground">
              {t('auth.createAccountDescription')}
            </p>
          </header>
          <form
            className="space-y-5"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
            aria-describedby={hasFormError ? 'register-form-error' : undefined}
          >
            <form.Field name="email">
              {(field) => {
                const hasValidationError =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                const hasError = hasValidationError || hasEmailError;

                return (
                  <div className="space-y-2">
                    <Label htmlFor="register-email">{t('auth.email')}</Label>
                    <Input
                      id="register-email"
                      name={field.name}
                      type="email"
                      autoComplete="email"
                      value={field.state.value}
                      aria-invalid={hasError}
                      aria-describedby={
                        hasError ? 'register-email-error' : undefined
                      }
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    {hasValidationError && (
                      <FieldError
                        id="register-email-error"
                        errors={field.state.meta.errors.map((error) => ({
                          message: error ? t(error.message) : undefined,
                        }))}
                      />
                    )}
                    {hasEmailError && serverError && (
                      <FieldError id="register-email-error">
                        {t(getApiErrorTranslationKeyForCode(serverError))}
                      </FieldError>
                    )}
                  </div>
                );
              }}
            </form.Field>
            <form.Field name="password">
              {(field) => {
                const hasError =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <div className="space-y-2">
                    <Label htmlFor="register-password">
                      {t('auth.password')}
                    </Label>
                    <PasswordInput
                      id="register-password"
                      name={field.name}
                      autoComplete="new-password"
                      value={field.state.value}
                      aria-invalid={hasError}
                      aria-describedby={
                        hasError ? 'register-password-error' : undefined
                      }
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    {hasError && (
                      <FieldError
                        id="register-password-error"
                        errors={field.state.meta.errors.map((error) => ({
                          message: error ? t(error.message) : undefined,
                        }))}
                      />
                    )}
                  </div>
                );
              }}
            </form.Field>
            <form.Field name="passwordConfirmation">
              {(field) => {
                const hasError =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <div className="space-y-2">
                    <Label htmlFor="register-password-confirmation">
                      {t('auth.confirmPassword')}
                    </Label>
                    <PasswordInput
                      id="register-password-confirmation"
                      name={field.name}
                      autoComplete="new-password"
                      value={field.state.value}
                      aria-invalid={hasError}
                      aria-describedby={
                        hasError
                          ? 'register-password-confirmation-error'
                          : undefined
                      }
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    {hasError && (
                      <FieldError
                        id="register-password-confirmation-error"
                        errors={field.state.meta.errors.map((error) => ({
                          message: error ? t(error.message) : undefined,
                        }))}
                      />
                    )}
                  </div>
                );
              }}
            </form.Field>
            {hasFormError && serverError && (
              <FieldError id="register-form-error">
                {t(getApiErrorTranslationKeyForCode(serverError))}
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
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting
                    ? t('auth.creatingAccount')
                    : t('auth.createAccount')}
                </Button>
              )}
            </form.Subscribe>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              to="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
