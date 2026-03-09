import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import es from './es';
import en from './en';

const LANGUAGE_KEY = '@acuerdo_plus_language';

export const getStoredLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch {
    return null;
  }
};

export const setStoredLanguage = async (lang: string | null): Promise<void> => {
  try {
    if (lang === null) {
      await AsyncStorage.removeItem(LANGUAGE_KEY);
    } else {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    }
  } catch {
    // ignore
  }
};

const getDeviceLanguage = (): string => {
  const locale = Localization.getLocales()?.[0]?.languageCode ?? 'en';
  return locale === 'es' ? 'es' : 'en';
};

const initI18n = async () => {
  const stored = await getStoredLanguage();
  const lng = stored ?? getDeviceLanguage();

  await i18next.use(initReactI18next).init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
};

initI18n();

export default i18next;
