import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './en';
import { ru } from './ru';

const LOCALE_STORAGE_KEY = 'locale';

export const locales = ['en', 'ru'] as const;
export type Locale = (typeof locales)[number];

const locale: Locale =
  typeof window !== 'undefined' &&
  localStorage.getItem(LOCALE_STORAGE_KEY) === 'ru'
    ? 'ru'
    : 'en';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: locale,
  fallbackLng: 'en',
  supportedLngs: ['en', 'ru'],
});

export function setLocale(locale: Locale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  return i18n.changeLanguage(locale);
}

export { i18n };
