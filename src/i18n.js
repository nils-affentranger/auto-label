import { createI18n } from 'vue-i18n';
import en from './locales/en';
import de from './locales/de';

// Get the browser language or use a stored preference
const getBrowserLanguage = () => {
  // Try to get from localStorage first (for returning users)
  const storedLang = localStorage.getItem('language');
  if (storedLang) {
    return storedLang;
  }
  
  // Otherwise detect from browser
  const browserLang = navigator.language.split('-')[0];
  return ['en', 'de'].includes(browserLang) ? browserLang : 'en';
};

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: getBrowserLanguage(),
  fallbackLocale: 'en',
  messages: {
    en,
    de
  }
});

export default i18n;