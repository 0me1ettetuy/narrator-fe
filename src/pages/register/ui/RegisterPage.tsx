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
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { FieldError } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
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
    <main className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-md items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('auth.createAccount')}</CardTitle>
          <CardDescription>
            {t('auth.createAccountDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
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
                    <Input
                      id="register-password"
                      name={field.name}
                      type="password"
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
                    <Input
                      id="register-password-confirmation"
                      name={field.name}
                      type="password"
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
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              to="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t('auth.signIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
