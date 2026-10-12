export const en = {
  about: {
    eyebrow: 'About Narrator',
    title: 'About us',
    description: 'More about Narrator is coming soon.',
  },
  auth: {
    alreadyHaveAccount: 'Already have an account?',
    confirmPassword: 'Confirm password',
    createAccount: 'Create account',
    createAccountDescription: 'Start using Narrator in a few seconds.',
    creatingAccount: 'Creating account…',
    email: 'Email',
    newToNarrator: 'New to Narrator?',
    password: 'Password',
    passwordsDoNotMatch: 'Passwords do not match.',
    signIn: 'Sign in',
    signInDescription: 'Welcome back to Narrator.',
    signingIn: 'Signing in…',
  },
  common: {
    account: 'Account',
    goBack: 'Go back',
    retry: 'Retry',
    signedIn: 'Signed in',
  },
  errors: {
    conflict: 'This request conflicts with existing data. Please try again.',
    emailAlreadyRegistered: 'An account with this email already exists.',
    forbidden: 'You do not have permission to do that.',
    invalidCredentials: 'Check your email and password and try again.',
    network: 'Unable to reach Narrator. Check your connection and try again.',
    notFound: 'The requested resource was not found.',
    rateLimited: 'Too many attempts. Please wait a moment and try again.',
    server: 'Narrator is having trouble. Please try again shortly.',
    unauthorized: 'Your session has expired. Please sign in again.',
    unknown: 'Something went wrong. Please try again.',
    validation: 'Check the entered values and try again.',
  },
  header: {
    primaryNavigation: 'Primary navigation',
  },
  hero: {
    createAccountDescription: 'Create an account to start using Narrator.',
    createAccount: 'Create account',
    openWorkspace: 'Open workspace',
    signedInAs: 'Signed in as {{email}}.',
    title: 'Turn ideas into clear stories.',
    yourAccount: 'your account',
  },
  home: {
    description: 'Your workspace is ready.',
    title: 'Welcome home',
  },
  navigation: {
    about: 'About',
    home: 'Home',
  },
  notFound: {
    description: 'The page you requested does not exist or has moved.',
    title: 'Page not found',
  },
  notifications: {
    accountCreated: 'Account created',
    signedIn: 'Signed in',
    signedOut: 'Signed out',
    signOutFailed: 'Could not sign out',
  },
  settings: {
    dark: 'Dark',
    language: 'Language',
    light: 'Light',
    open: 'Open settings',
    theme: 'Theme',
  },
  states: {
    emptyDescription: 'There is no data to display yet.',
    emptyTitle: 'Nothing here yet',
    errorDescription: 'Please try again in a moment.',
    errorTitle: 'Could not load data',
    loading: 'Loading…',
  },
  sidebar: {
    logOut: 'Log out',
    toggle: 'Toggle sidebar',
  },
};

export type Translation = typeof en;
