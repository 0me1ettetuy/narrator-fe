import { useTranslation } from 'react-i18next';
import { setLocale, type Locale } from './i18n';

function toLocale(language: string | undefined): Locale {
  return language === 'ru' ? 'ru' : 'en';
}

export function useLocale() {
  const { i18n } = useTranslation();
  const locale = toLocale(i18n.resolvedLanguage);

  return {
    locale,
    toggleLocale: () => {
      void setLocale(locale === 'en' ? 'ru' : 'en');
    },
  };
}
