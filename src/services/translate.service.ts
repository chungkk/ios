// Translation service - integrates with Next.js translate API
// Supports multi-provider translation (OpenAI, Google, Groq, MyMemory)
// + Gemma on-device offline translation via llama.rn

import api from './api';
import { gemmaService } from './gemma.service';

export interface TranslateRequest {
  text: string;
  context?: string;
  sourceLang?: string;
  targetLang?: string;
  sentenceTranslation?: string;
  mode?: 'word' | 'sentence';
}

export interface TranslateResponse {
  success: boolean;
  originalText: string;
  translation: string;
  method: string;
  sourceLang: string;
  targetLang: string;
  warning?: string;
}

/**
 * Translate text using backend multi-provider API
 * POST /api/translate
 */
export const translateText = async (request: TranslateRequest): Promise<TranslateResponse> => {
  try {
    const response = await api.post<TranslateResponse>('/api/translate', {
      text: request.text,
      context: request.context || '',
      sourceLang: request.sourceLang || 'de',
      targetLang: request.targetLang || 'vi',
      sentenceTranslation: request.sentenceTranslation || '',
      mode: request.mode || 'word',
    });

    return response.data;
  } catch (error) {
    console.error('[TranslateService] Error:', error);
    // Return original text on error
    return {
      success: false,
      originalText: request.text,
      translation: request.text,
      method: 'error',
      sourceLang: request.sourceLang || 'de',
      targetLang: request.targetLang || 'vi',
      warning: 'Translation failed',
    };
  }
};

/**
 * Attempt offline translation using Gemma on-device LLM.
 * Returns the translation string and source indicator, or null if not available.
 */
export const tryOfflineTranslation = async (
  word: string,
  context: string,
  targetLang: string = 'vi'
): Promise<{ translation: string; source: 'offline' } | null> => {
  // Auto-initialize if model is downloaded but not loaded yet
  if (!gemmaService.isReady()) {
    const hasModel = await gemmaService.isAnyModelDownloaded();
    if (!hasModel) {
      return null;
    }
    console.log('[TranslateService] Auto-initializing Gemma...');
    const ok = await gemmaService.initialize();
    if (!ok) {
      console.warn('[TranslateService] Gemma init failed — using online');
      return null;
    }
    console.log('[TranslateService] Gemma ready');
  }

  try {
    const result = await gemmaService.translateWord(word, context, targetLang);
    if (result.source === 'offline' && result.translation) {
      return { translation: result.translation, source: 'offline' };
    }
    return null;
  } catch (error) {
    console.warn('[TranslateService] Offline translation failed:', error);
    return null;
  }
};

/**
 * Smart translate: tries offline first (if available), falls back to online API.
 * Returns both the translation and the source ('offline' | 'online' | 'error').
 */
export const smartTranslateWord = async (
  word: string,
  context: string,
  sentenceTranslation?: string,
  targetLang: string = 'vi',
  preferOffline: boolean = false
): Promise<{ translation: string; source: 'offline' | 'online' | 'error' }> => {
  // Try offline first if preferred and available
  if (preferOffline) {
    const offlineResult = await tryOfflineTranslation(word, context, targetLang);
    if (offlineResult) {
      return offlineResult;
    }
  }

  // Fall back to online API
  try {
    const response = await translateText({
      text: word,
      context,
      sentenceTranslation,
      targetLang,
      mode: 'word',
    });

    return {
      translation: response.translation,
      source: response.success ? 'online' : 'error',
    };
  } catch {
    // If online also fails and we didn't try offline yet, try it as last resort
    if (!preferOffline) {
      const offlineResult = await tryOfflineTranslation(word, context, targetLang);
      if (offlineResult) {
        return offlineResult;
      }
    }

    return { translation: word, source: 'error' };
  }
};

/**
 * Translate a word with context for better accuracy
 */
export const translateWord = async (
  word: string,
  context: string,
  sentenceTranslation?: string,
  targetLang: string = 'vi'
): Promise<string> => {
  const response = await translateText({
    text: word,
    context,
    sentenceTranslation,
    targetLang,
    mode: 'word',
  });
  return response.translation;
};

/**
 * Translate a full sentence naturally
 */
export const translateSentence = async (
  sentence: string,
  targetLang: string = 'vi'
): Promise<string> => {
  const response = await translateText({
    text: sentence,
    targetLang,
    mode: 'sentence',
  });
  return response.translation;
};

export const translateService = {
  translateText,
  translateWord,
  translateSentence,
  smartTranslateWord,
  tryOfflineTranslation,
};

export default translateService;
