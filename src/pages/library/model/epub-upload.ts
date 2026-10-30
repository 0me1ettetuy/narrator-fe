import { z } from 'zod';

export const EPUB_MIME_TYPE = 'application/epub+zip';
export const MAX_EPUB_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const epubFileSchema = z
  .instanceof(File, { error: 'validation.epubFileRequired' })
  .refine((file) => /\.epub$/iu.test(file.name), {
    error: 'validation.epubFileInvalid',
  })
  .refine((file) => file.size <= MAX_EPUB_FILE_SIZE_BYTES, {
    error: 'validation.epubFileTooLarge',
  });

export const epubUploadsSchema = z.object({
  files: z.array(epubFileSchema).min(1, {
    error: 'validation.epubFileRequired',
  }),
});
