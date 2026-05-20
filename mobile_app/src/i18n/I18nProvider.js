import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getLanguage, saveLanguage } from '../utils/storage';
import translations from './translations';

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getLanguage().then((saved) => {
      if (saved) setLang(saved);
      setReady(true);
    });
  }, []);

  const changeLang = useCallback(async (code) => {
    setLang(code);
    await saveLanguage(code);
  }, []);

  const t = useCallback(
    (key) => {
      if (!lang) return translations.en[key] || key;
      return translations[lang]?.[key] || translations.en[key] || key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, changeLang, t, langReady: ready }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
