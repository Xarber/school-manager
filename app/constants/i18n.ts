import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import en from '@/locales/en.json';
import it from '@/locales/it.json';

export const localeMap: Record<string, string> = {
  en: 'en-GB',
  it: 'it-IT',
};

export const translations = {
  en,
  it,
};

// // Ensure singleton instance across imports
// let i18n: I18n;

// if (!(global as any).__i18n) {
//   (global as any).__i18n = new I18n(translations);
// }

// i18n = (global as any).__i18n;

const i18n = new I18n(translations);

// Manual language setter (does NOT auto apply)
let currentLocale = getLocales()[0]?.languageCode ?? 'en';

export const setLocale = (locale: string) => {
  currentLocale = locale;
  i18n.locale = locale;
};

export const getLocale = () => currentLocale;

i18n.enableFallback = true;
i18n.defaultLocale = 'en';
i18n.locale = currentLocale;

export default i18n;