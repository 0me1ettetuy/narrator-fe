import { createContext } from 'react';

export type Theme = 'dark' | 'light';

export type ThemeContextValue = {
  isDark: boolean;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
