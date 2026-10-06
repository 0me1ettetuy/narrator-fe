import { client } from './generated/client.gen';
import { session } from '@/shared/auth';

const baseUrl = import.meta.env.VITE_BACKEND_URL;
const refreshUrl = new URL('/auth/refresh', baseUrl).toString();

let refreshPromise: Promise<string | undefined> | undefined;

const refreshAccessToken = async (): Promise<string | undefined> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const headers = new Headers();
    const csrfToken = session.getCsrfToken();

    if (csrfToken) {
      headers.set('x-csrf-token', csrfToken);
    }

    const response = await globalThis.fetch(refreshUrl, {
      method: 'POST',
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      session.clearAccessToken();
      return undefined;
    }

    const data: unknown = await response.json();

    if (
      !data ||
      typeof data !== 'object' ||
      !('accessToken' in data) ||
      typeof data.accessToken !== 'string'
    ) {
      session.clearAccessToken();
      return undefined;
    }

    session.setAccessToken(data.accessToken);
    return data.accessToken;
  })().finally(() => {
    refreshPromise = undefined;
  });

  return refreshPromise;
};

const fetchWithTokenRefresh: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const retryRequest = request.clone();
  const response = await globalThis.fetch(request);

  const canRefresh =
    response.status === 401 &&
    request.headers.has('Authorization') &&
    request.url !== refreshUrl;

  const accessToken = canRefresh ? await refreshAccessToken() : undefined;

  if (!accessToken) {
    return response;
  }

  retryRequest.headers.set('Authorization', `Bearer ${accessToken}`);
  return globalThis.fetch(retryRequest);
};

client.setConfig({
  baseUrl,
  credentials: 'include',
  fetch: fetchWithTokenRefresh,
});

client.interceptors.request.use((request) => {
  const accessToken = session.getAccessToken();
  const csrfToken = session.getCsrfToken();

  if (accessToken) {
    request.headers.set('Authorization', `Bearer ${accessToken}`);
  }

  if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    request.headers.set('x-csrf-token', csrfToken);
  }

  return request;
});
