'use client';
import React, { createContext, useState, useContext, useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import esMessages from './messages/es';
import enMessages from './messages/en';
import { addLocale } from 'primereact/api';
import { esLocale } from './messages/esLocale';
import { LanguageContextType } from '../types';

const messages = {
  es: esMessages,
  en: enMessages
};

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  switchLanguage: () => {}
});

// ✅ Mover funciones ANTES del componente
function getBrowserLanguage(): string {
  if (typeof navigator === 'undefined') return 'es'; // SSR default
  const browserLang = navigator.language.split(/[-_]/)[0];
  return (messages as any)[browserLang] ? browserLang : 'es';
}

const getSavedLocale = (): string => {
  if (typeof window === 'undefined') return 'es'; // SSR default
  const savedLocale = localStorage.getItem('locale');
  return savedLocale && (messages as any)[savedLocale] ? savedLocale : getBrowserLanguage();
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocale] = useState(() => getSavedLocale());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      addLocale('es', esLocale);
    }
  }, []);

  const switchLanguage = (newLocale: string) => {
    setLocale(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = getSavedLocale();
      if (savedLocale && (messages as any)[savedLocale]) {
        setLocale(savedLocale);
      }
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, switchLanguage }}>
      <IntlProvider messages={(messages as any)[locale]} locale={locale}>
        {children as any}
      </IntlProvider>
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => useContext(LanguageContext);
