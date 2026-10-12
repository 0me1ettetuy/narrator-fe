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
import { loginMutationOptions } from '@/shared/auth';
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
import { loginSchema } from '../model/login';

export function LoginPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const login = useMutation(loginMutationOptions(queryClient));
  const [serverError, setServerError] = useState<ApiErrorCode | null>(null);
  const { t } = useTranslation();

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onMount: loginSchema,
      onChange: loginSchema,
      onSubmit: loginSchema,
    },
    listeners: {
      onChange: () => setServerError(null),
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      try {
        await login.mutateAsync({ body: value });
        toast.add({ title: t('notifications.signedIn'), type: 'success' });
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
          <CardTitle>{t('auth.signIn')}</CardTitle>
          <CardDescription>{t('auth.signInDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
            aria-describedby={serverError ? 'login-form-error' : undefined}
          >
            <form.Field name="email">
              {(field) => {
                const hasError =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t('auth.email')}</Label>
                    <Input
                      id="login-email"
                      name={field.name}
                      type="email"
                      autoComplete="email"
                      value={field.state.value}
                      aria-invalid={hasError}
                      aria-describedby={
                        hasError ? 'login-email-error' : undefined
                      }
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    {hasError && (
                      <FieldError
                        id="login-email-error"
                        errors={field.state.meta.errors.map((error) => ({
                          message: error ? t(error.message) : undefined,
                        }))}
                      />
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
                    <Label htmlFor="login-password">{t('auth.password')}</Label>
                    <Input
                      id="login-password"
                      name={field.name}
                      type="password"
                      autoComplete="current-password"
                      value={field.state.value}
                      aria-invalid={hasError}
                      aria-describedby={
                        hasError ? 'login-password-error' : undefined
                      }
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    {hasError && (
                      <FieldError
                        id="login-password-error"
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
              <FieldError id="login-form-error">
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
                  {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
                </Button>
              )}
            </form.Subscribe>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('auth.newToNarrator')}{' '}
            <Link
              to="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t('auth.createAccount')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
