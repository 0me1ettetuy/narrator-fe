import { z } from 'zod';

export const BOOK_COVER_MIME_TYPES = [
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export const MAX_BOOK_COVER_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const bookCoverFileSchema = z
  .instanceof(File, { error: 'validation.bookCoverFileRequired' })
  .refine((file) => BOOK_COVER_MIME_TYPES.includes(file.type as never), {
    error: 'validation.bookCoverFileInvalid',
  })
  .refine((file) => file.size <= MAX_BOOK_COVER_FILE_SIZE_BYTES, {
    error: 'validation.bookCoverFileTooLarge',
  });

export const bookCoverUploadSchema = z.object({
  file: bookCoverFileSchema.nullable().refine((file) => file !== null, {
    error: 'validation.bookCoverFileRequired',
  }),
});
