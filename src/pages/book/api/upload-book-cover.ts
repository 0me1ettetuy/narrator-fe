import { client } from '@/shared/api';

type CreateBookCoverUploadResponse = {
  uploadUrl: string;
};

type ResponseBody<TResponse, TStatus extends number> = {
  [status in TStatus]: TResponse;
};

export async function uploadBookCover(
  bookId: string,
  file: File,
): Promise<void> {
  const encodedBookId = encodeURIComponent(bookId);
  const metadata = { mimeType: file.type, size: file.size };
  const uploadIntent = await postJson<CreateBookCoverUploadResponse, 201>(
    `/books/${encodedBookId}/cover/upload`,
    metadata,
  );
  const uploadResponse = await globalThis.fetch(uploadIntent.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('Book cover upload failed');
  }

  await client.post<ResponseBody<undefined, 204>, unknown, true>({
    url: `/books/${encodedBookId}/cover/upload-complete`,
    body: metadata,
    headers: { 'Content-Type': 'application/json' },
    bodySerializer: JSON.stringify,
    throwOnError: true,
  });
}

async function postJson<TResponse, TStatus extends number>(
  url: string,
  body: unknown,
): Promise<TResponse> {
  const { data } = await client.post<
    ResponseBody<TResponse, TStatus>,
    unknown,
    true
  >({
    url,
    body,
    headers: { 'Content-Type': 'application/json' },
    bodySerializer: JSON.stringify,
    throwOnError: true,
  });

  return data as TResponse;
}
