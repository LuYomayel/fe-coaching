import React, { createContext, useState, useContext, useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import esMessages from './messages/es';
import enMessages from './messages/en';

const messages = {
  'es': esMessages,
  'en': enMessages,
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(getBrowserLanguage());

  function getBrowserLanguage() {
    const browserLang = navigator.language.split(/[-_]/)[0];
    return messages[browserLang] ? browserLang : 'en';
  }

  const getSavedLocale = () => {
    const savedLocale = localStorage.getItem('locale');
    return savedLocale ? savedLocale : 'en';
  };

  const switchLanguage = (newLocale) => {
    setLocale(newLocale);
  };

  useEffect(() => {
    const savedLocale = getSavedLocale();
    if (savedLocale && messages[savedLocale]) {
      setLocale(savedLocale);
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