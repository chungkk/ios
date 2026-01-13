import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../utils/i18n';

const SETTINGS_STORAGE_KEY = '@app_settings';

interface AppSettings {
  hapticEnabled: boolean;
  nativeLanguage: string;
  autoStop: boolean;
  showTranslation: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  toggleHaptic: () => Promise<void>;
  setNativeLanguage: (lang: string) => Promise<void>;
  toggleAutoStop: () => Promise<void>;
  toggleShowTranslation: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  hapticEnabled: true,
  nativeLanguage: 'de',
  autoStop: false,
  showTranslation: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const loadedSettings = { ...defaultSettings, ...parsed };
          setSettings(loadedSettings);
          // Sync i18n language with saved setting
          if (loadedSettings.nativeLanguage) {
            i18n.changeLanguage(loadedSettings.nativeLanguage);
          }
        }
      } catch (error) {
        console.error('[SettingsContext] Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Save settings to storage
  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('[SettingsContext] Failed to save settings:', error);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveSettings(updated);
  }, [settings, saveSettings]);

  // Toggle haptic feedback
  const toggleHaptic = useCallback(async () => {
    const updated = { ...settings, hapticEnabled: !settings.hapticEnabled };
    setSettings(updated);
    await saveSettings(updated);
  }, [settings, saveSettings]);

  // Set native language
  const setNativeLanguage = useCallback(async (lang: string) => {
    const updated = { ...settings, nativeLanguage: lang };
    setSettings(updated);
    await saveSettings(updated);
    // Update i18n language
    i18n.changeLanguage(lang);
  }, [settings, saveSettings]);

  // Toggle auto-stop
  const toggleAutoStop = useCallback(async () => {
    const updated = { ...settings, autoStop: !settings.autoStop };
    setSettings(updated);
    await saveSettings(updated);
  }, [settings, saveSettings]);

  // Toggle show translation
  const toggleShowTranslation = useCallback(async () => {
    const updated = { ...settings, showTranslation: !settings.showTranslation };
    setSettings(updated);
    await saveSettings(updated);
  }, [settings, saveSettings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, toggleHaptic, setNativeLanguage, toggleAutoStop, toggleShowTranslation }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export default SettingsContext;
