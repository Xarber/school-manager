import { getLocale, setLocale } from '@/constants/i18n';
import { useUserData } from '@/data/UserDataContext';
import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

const LanguageContext = createContext({
  locale: 'en',
  setAppLocale: (lang: string) => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const systemLocale = getLocale() as string;
  const [locale, setLocaleState] = useState(systemLocale);
  const userData = useUserData();

  const setAppLocale = (lang: string) => {
    setLocale(lang);        // updates i18n
    setLocaleState(lang);   // triggers global rerender
  };

  useEffect(() => {
      const userLanguage = userData.data.settings?.language;

      if (userLanguage === "system") {
          setAppLocale(systemLocale);
      } else if (userLanguage) {
          setAppLocale(userLanguage);
      }
  }, [userData.data.settings?.language, systemLocale]);

  return (
    <LanguageContext.Provider key={locale} value={{ locale, setAppLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  return useContext(LanguageContext);
}