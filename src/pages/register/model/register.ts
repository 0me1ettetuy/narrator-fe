import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, { error: 'validation.emailRequired', abort: true })
      .max(254, { error: 'validation.emailTooLong', abort: true })
      .email({ error: 'validation.emailInvalid' }),
    password: z
      .string()
      .min(1, { error: 'validation.passwordRequired', abort: true })
      .min(8, { error: 'validation.passwordTooShort', abort: true })
      .max(72, { error: 'validation.passwordTooLong' }),
    passwordConfirmation: z
      .string()
      .min(1, { error: 'validation.passwordConfirmationRequired' }),
  })
  .superRefine(({ password, passwordConfirmation }, context) => {
    if (passwordConfirmation && password !== passwordConfirmation) {
      context.addIssue({
        code: 'custom',
        message: 'validation.passwordsDoNotMatch',
        path: ['passwordConfirmation'],
      });
    }
  });
