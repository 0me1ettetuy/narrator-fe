import { z } from 'zod';

export const fishVoiceSchema = z.object({
  referenceId: z
    .string()
    .trim()
    .min(1, { error: 'validation.fishVoiceIdRequired', abort: true })
    .max(256, { error: 'validation.fishVoiceIdTooLong' }),
  name: z.string().trim().max(80, { error: 'validation.fishVoiceNameTooLong' }),
});
