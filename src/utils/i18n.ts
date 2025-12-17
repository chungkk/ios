import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import de from '../assets/locales/de.json';
import en from '../assets/locales/en.json';
import vi from '../assets/locales/vi.json';

const resources = {
  de: { translation: de },
  en: { translation: en },
  vi: { translation: vi },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'de', // Default language (German for German learning app)
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    compatibilityJSON: 'v4', // For React Native compatibility
  });

export default i18n;
