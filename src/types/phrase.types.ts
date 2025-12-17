/**
 * Daily Phrase Types
 * Types for German phrase learning (Nomen-Verb-Verbindungen)
 */

export interface DailyPhrase {
  phrase: string;           // German phrase (e.g., "Angst haben vor + D")
  meaning: string;          // German meaning/definition
  en: string;              // English translation
  vi: string;              // Vietnamese translation
  example: string;         // Example sentence in German
  explanation?: {          // Detailed explanation (cached or from API)
    en?: string;
    vi?: string;
  };
}

export interface PhraseExplanationRequest {
  phrase: string;
  meaning: string;
  example: string;
  targetLang: 'vi' | 'en' | 'de';
}

export interface PhraseExplanationResponse {
  explanation: string;
}
