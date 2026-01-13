// Translation service - integrates with Next.js translate API
// Supports multi-provider translation (OpenAI, Google, Groq, MyMemory)

import api from './api';

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
};

export default translateService;
