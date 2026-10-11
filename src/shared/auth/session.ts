import { useSyncExternalStore } from 'react';

type SessionSnapshot = {
  accessToken: string | undefined;
  csrfToken: string | undefined;
};

let snapshot: SessionSnapshot = {
  accessToken: undefined,
  csrfToken: undefined,
};

const listeners = new Set<() => void>();

function updateSession(partial: Partial<SessionSnapshot>) {
  snapshot = { ...snapshot, ...partial };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

export function useSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const session = {
  clear: () => {
    updateSession({ accessToken: undefined, csrfToken: undefined });
  },
  clearAccessToken: () => {
    updateSession({ accessToken: undefined });
  },
  getAccessToken: () => snapshot.accessToken,
  getCsrfToken: () => snapshot.csrfToken,
  setAccessToken: (token: string) => {
    updateSession({ accessToken: token });
  },
  setCsrfToken: (token: string) => {
    updateSession({ csrfToken: token });
  },
};
