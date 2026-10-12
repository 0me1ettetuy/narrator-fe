import { useEffect, type PropsWithChildren } from 'react';
import { i18n } from '@/shared/i18n';

export function I18nProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const setDocumentLanguage = (language: string) => {
      document.documentElement.lang = language;
    };

    setDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);
    i18n.on('languageChanged', setDocumentLanguage);

    return () => {
      i18n.off('languageChanged', setDocumentLanguage);
    };
  }, []);

  return children;
}
