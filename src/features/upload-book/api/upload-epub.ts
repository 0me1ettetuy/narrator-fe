import { client } from '@/shared/api';
import { EPUB_MIME_TYPE } from '../model/epub-upload';

type CreateBookUploadResponse = {
  bookId: string;
  uploadUrl: string;
};

type CompleteBookUploadResponse = {
  bookId: string;
  jobId: string;
  parseStatus: 'QUEUED';
};

type ResponseBody<TResponse> = {
  200: TResponse;
};

export async function uploadEpub(
  file: File,
): Promise<CompleteBookUploadResponse> {
  const uploadIntent = await postJson<CreateBookUploadResponse>(
    '/books/uploads',
    {
      filename: file.name,
      mimeType: EPUB_MIME_TYPE,
      size: file.size,
    },
  );

  const uploadResponse = await globalThis.fetch(uploadIntent.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': EPUB_MIME_TYPE },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('EPUB upload failed');
  }

  return postJson<CompleteBookUploadResponse>(
    `/books/${encodeURIComponent(uploadIntent.bookId)}/upload-complete`,
  );
}

async function postJson<TResponse>(
  url: string,
  body?: unknown,
): Promise<TResponse> {
  const { data } = await client.post<ResponseBody<TResponse>, unknown, true>({
    url,
    body,
    headers: { 'Content-Type': 'application/json' },
    bodySerializer: JSON.stringify,
    throwOnError: true,
  });

  return data;
}
