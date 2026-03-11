import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import en from '@/locales/en.json';
import it from '@/locales/it.json';

const translations = {
  en,
  it,
};

const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = 'en';
i18n.locale = getLocales()[0]?.languageCode ?? 'en';

export default i18n;