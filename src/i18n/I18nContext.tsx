import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppLanguage } from '../types/cinema';
import { UI_TEXT } from './translations';

interface I18nContextValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  t: (typeof UI_TEXT)[AppLanguage];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLang = 'es',
}: {
  children: ReactNode;
  initialLang?: AppLanguage;
}) {
  // Idioma almacenado solo en memoria React (sin cookies ni localStorage)
  const [lang, setLang] = useState<AppLanguage>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang === 'va' ? 'ca' : lang;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: UI_TEXT[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n debe usarse dentro de un I18nProvider.');
  }
  return ctx;
}
