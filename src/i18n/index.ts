import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform, NativeModules } from 'react-native';
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
  try {
    let locale = 'en';
    if (Platform.OS === 'ios') {
      locale = NativeModules.SettingsManager?.settings?.AppleLocale
        || NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        || 'en';
    } else {
      locale = NativeModules.I18nManager?.localeIdentifier || 'en';
    }
    return locale.startsWith('es') ? 'es' : 'en';
  } catch {
    return 'en';
  }
};

// Initialize synchronously with device language
i18next.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  initImmediate: false,
});

// Then load stored preference and override if needed
getStoredLanguage().then((stored) => {
  if (stored && stored !== i18next.language) {
    i18next.changeLanguage(stored);
  }
});

export default i18next;
