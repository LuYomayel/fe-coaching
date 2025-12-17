import React, { createContext, useState, useContext, useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import esMessages from './messages/es';
import enMessages from './messages/en';
import { addLocale } from 'primereact/api';
import { esLocale } from './messages/esLocale';
const messages = {
  es: esMessages,
  en: enMessages
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('es'); // Por defecto: español
  useEffect(() => {
    addLocale('es', esLocale);
  }, []);

  function getBrowserLanguage() {
    const browserLang = navigator.language.split(/[-_]/)[0];
    return messages[browserLang] ? browserLang : 'es'; // Por defecto: español
  }

  const getSavedLocale = () => {
    const savedLocale = localStorage.getItem('locale');
    return savedLocale ? savedLocale : 'es'; // Por defecto: español
  };

  const switchLanguage = (newLocale) => {
    setLocale(newLocale);
  };

  useEffect(() => {
    const savedLocale = getSavedLocale();
    if (savedLocale && messages[savedLocale]) {
      setLocale(savedLocale);
    } else {
      // Si no hay locale guardado, usar español por defecto
      setLocale('es');
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, switchLanguage }}>
      <IntlProvider messages={messages[locale]} locale={locale}>
        {children}
      </IntlProvider>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
