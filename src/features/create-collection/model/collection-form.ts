import { z } from 'zod';

export const collectionFormSchema = z.object({
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
