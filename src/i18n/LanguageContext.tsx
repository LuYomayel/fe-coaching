import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import esMessages from './messages/es';
import enMessages from './messages/en';
import { addLocale } from 'primereact/api';
import { esLocale } from './messages/esLocale';

type Locale = 'es' | 'en';

const messages: Record<Locale, Record<string, string>> = {
  es: esMessages,
  en: enMessages
};

interface ILanguageContextValue {
  locale: Locale;
  switchLanguage: (newLocale: Locale) => void;
}

const LanguageContext = createContext<ILanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('es');

  useEffect(() => {
    addLocale('es', esLocale);
  }, []);

  const getSavedLocale = (): Locale => {
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    return savedLocale ? savedLocale : 'es';
  };

  const switchLanguage = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  useEffect(() => {
    const savedLocale = getSavedLocale();
    if (savedLocale && messages[savedLocale]) {
      setLocale(savedLocale);
    } else {
      setLocale('es');
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, switchLanguage }}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <IntlProvider messages={messages[locale]} locale={locale}>
        {children as any}
      </IntlProvider>
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): ILanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
