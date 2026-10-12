import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { error: 'validation.emailRequired', abort: true })
    .max(254, { error: 'validation.emailTooLong', abort: true })
    .email({ error: 'validation.emailInvalid' }),
  password: z
    .string()
    .min(1, { error: 'validation.passwordRequired', abort: true })
    .max(72, { error: 'validation.passwordTooLong' }),
});
