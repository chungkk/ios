// Whisper transcription service for voice recording
// Calls backend API to convert speech to text

import { API_BASE_URL } from '../config/api';

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  message?: string;
  error?: string;
}

export interface ComparisonResult {
  transcribed: string;
  original: string;
  similarity: number;
  isCorrect: boolean;
  wordComparison: Record<number, 'correct' | 'incorrect' | 'missing'>;
}

class WhisperService {
  /**
   * Transcribe audio blob using Whisper API
   */
  async transcribe(audioUri: string, language: string = 'de'): Promise<TranscriptionResult> {
    try {
      console.log('[WhisperService] Starting transcription, URI:', audioUri);
      console.log('[WhisperService] API endpoint:', `${API_BASE_URL}/api/whisper-transcribe`);

      const formData = new FormData();
      
      // Create file object from URI
      const file = {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'voice-recording.m4a',
      } as any;

      formData.append('audio', file);
      formData.append('language', language);

      console.log('[WhisperService] Sending request with file:', file.name);

      const response = await fetch(`${API_BASE_URL}/api/whisper-transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type manually for FormData with file uploads
          // Let the browser/runtime set it with the boundary
          'Accept': 'application/json',
        },
      });

      console.log('[WhisperService] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[WhisperService] HTTP error:', response.status, errorText);
        return {
          success: false,
          message: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json();
      console.log('[WhisperService] Response data:', data);

      if (data.success && data.text) {
        console.log('[WhisperService] Transcription successful:', data.text);
        return {
          success: true,
          text: data.text.trim(),
        };
      }

      return {
        success: false,
        message: data.message || 'Transcription failed',
      };
    } catch (error) {
      console.error('[WhisperService] Transcription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to transcribe audio',
      };
    }
  }

  /**
   * Calculate text similarity between transcribed and original text
   */
  compareTexts(transcribedText: string, originalText: string): ComparisonResult {
    const normalize = (str: string) => 
      str.toLowerCase()
        .trim()
        .replace(/[.,!?;:"""''„]/g, '')
        .replace(/\s+/g, ' ');

    const normalized1 = normalize(transcribedText);
    const normalized2 = normalize(originalText);

    const words1 = normalized1.split(' ').filter(w => w.length > 0);
    const words2 = normalized2.split(' ').filter(w => w.length > 0);

    // Word-by-word comparison
    const wordComparison: Record<number, 'correct' | 'incorrect' | 'missing'> = {};
    const maxLength = Math.max(words1.length, words2.length);

    for (let i = 0; i < maxLength; i++) {
      const userWord = words1[i] || '';
      const correctWord = words2[i] || '';

      if (userWord && correctWord) {
        wordComparison[i] = userWord === correctWord ? 'correct' : 'incorrect';
      } else if (correctWord && !userWord) {
        wordComparison[i] = 'missing';
      }
    }

    // Calculate overall similarity
    let matches = 0;
    words1.forEach(word => {
      if (words2.includes(word)) {
        matches++;
      }
    });

    const similarity = maxLength > 0 ? Math.round((matches / maxLength) * 100) : 0;

    return {
      transcribed: transcribedText,
      original: originalText,
      similarity,
      isCorrect: similarity >= 80,
      wordComparison,
    };
  }

  /**
   * Validate transcription result
   * Filters out common error messages from Whisper
   */
  isValidTranscription(text: string): boolean {
    if (!text || text.length <= 2) {
      return false;
    }

    const errorPhrases = [
      'Untertitelung aufgrund der Audioqualität nicht möglich',
      'Untertitel',
      'Bitte',
      'Danke',
      'Thank you',
    ];

    return !errorPhrases.some(phrase =>
      text.toLowerCase().includes(phrase.toLowerCase())
    );
  }
}

export const whisperService = new WhisperService();
export default whisperService;
