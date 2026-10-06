let accessToken: string | undefined;
let csrfToken: string | undefined;

export const session = {
  clear: () => {
    accessToken = undefined;
    csrfToken = undefined;
  },
  clearAccessToken: () => {
    accessToken = undefined;
  },
  getAccessToken: () => accessToken,
  getCsrfToken: () => csrfToken,
  setAccessToken: (token: string) => {
    accessToken = token;
  },
  setCsrfToken: (token: string) => {
    csrfToken = token;
  },
};
