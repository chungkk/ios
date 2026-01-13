import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

// Storage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  LESSONS_CACHE: 'lessons_cache_',
  CATEGORIES_CACHE: 'categories_active',
  PROGRESS_QUEUE: 'progress_queue',
  OFFLINE_DOWNLOADS: 'offline_downloads',
  SETTINGS: 'app_settings',
};

// ===== AsyncStorage Functions (General Data) =====

/**
 * Save data to AsyncStorage
 */
export const saveData = async <T>(key: string, value: T): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`[Storage] Error saving data for key "${key}":`, error);
    throw error;
  }
};

/**
 * Get data from AsyncStorage
 */
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`[Storage] Error getting data for key "${key}":`, error);
    return null;
  }
};

/**
 * Remove data from AsyncStorage
 */
export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`[Storage] Error removing data for key "${key}":`, error);
    throw error;
  }
};

/**
 * Clear all AsyncStorage data
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('[Storage] Error clearing all data:', error);
    throw error;
  }
};

// ===== Keychain Functions (Secure Token Storage) =====

const TOKEN_SERVICE = 'com.awesomeproject.auth';
const TOKEN_USERNAME = 'jwt_token';

/**
 * Save JWT token securely to iOS Keychain
 */
export const saveToken = async (token: string): Promise<void> => {
  try {
    await Keychain.setGenericPassword(TOKEN_USERNAME, token, {
      service: TOKEN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    });
  } catch (error) {
    console.error('[Storage] Error saving token to Keychain:', error);
    throw error;
  }
};

/**
 * Get JWT token from iOS Keychain
 */
export const getToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: TOKEN_SERVICE,
    });
    
    if (credentials) {
      return credentials.password;
    }
    return null;
  } catch (error) {
    console.error('[Storage] Error getting token from Keychain:', error);
    return null;
  }
};

/**
 * Remove JWT token from iOS Keychain
 */
export const removeToken = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword({
      service: TOKEN_SERVICE,
    });
  } catch (error) {
    console.error('[Storage] Error removing token from Keychain:', error);
    throw error;
  }
};

// ===== Cache Helper Functions =====

/**
 * Save data with timestamp for cache expiry
 */
export const saveCache = async <T>(key: string, data: T, ttlSeconds: number = 3600): Promise<void> => {
  const cacheData = {
    data,
    timestamp: Date.now(),
    ttl: ttlSeconds * 1000, // Convert to milliseconds
  };
  await saveData(key, cacheData);
};

/**
 * Get cached data if not expired
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  const cacheData = await getData<{
    data: T;
    timestamp: number;
    ttl: number;
  }>(key);

  if (!cacheData) {
    return null;
  }

  const now = Date.now();
  const isExpired = now - cacheData.timestamp > cacheData.ttl;

  if (isExpired) {
    await removeData(key);
    return null;
  }

  return cacheData.data;
};

// Export storage keys for use in services
export { STORAGE_KEYS };
