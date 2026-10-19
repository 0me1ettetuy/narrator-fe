import { z } from 'zod';

export const EPUB_MIME_TYPE = 'application/epub+zip';
export const MAX_EPUB_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const epubUploadSchema = z.object({
  file: z
    .instanceof(File, { error: 'validation.epubFileRequired' })
    .nullable()
    .refine((file) => file !== null, {
      error: 'validation.epubFileRequired',
    })
    .refine((file) => file === null || /\.epub$/iu.test(file.name), {
      error: 'validation.epubFileInvalid',
    })
    .refine((file) => file === null || file.size <= MAX_EPUB_FILE_SIZE_BYTES, {
      error: 'validation.epubFileTooLarge',
    }),
});
