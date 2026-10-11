import { session } from './session';

const csrfUrl = new URL(
  '/auth/csrf',
  import.meta.env.VITE_BACKEND_URL,
).toString();

export async function renewCsrfToken(): Promise<boolean> {
  const response = await globalThis.fetch(csrfUrl, {
    credentials: 'include',
  });

  if (!response.ok) {
    return false;
  }

  const data: unknown = await response.json();

  if (
    !data ||
    typeof data !== 'object' ||
    !('csrfToken' in data) ||
    typeof data.csrfToken !== 'string'
  ) {
    return false;
  }

  session.setCsrfToken(data.csrfToken);
  return true;
}
