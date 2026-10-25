import { z } from 'zod';

export const fishCredentialSchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(8, { error: 'validation.fishApiKeyTooShort', abort: true })
    .max(1_024, { error: 'validation.fishApiKeyTooLong' }),
});
