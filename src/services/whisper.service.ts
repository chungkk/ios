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
   * Calculate Longest Common Subsequence (LCS) for better word matching
   * This handles cases where user says correct words but in different positions
   */
  private findLCS(words1: string[], words2: string[]): number[] {
    const m = words1.length;
    const n = words2.length;

    // DP table
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (words1[i - 1] === words2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to find which original words were matched
    const matchedOriginalIndices: number[] = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (words1[i - 1] === words2[j - 1]) {
        matchedOriginalIndices.unshift(j - 1);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return matchedOriginalIndices;
  }

  /**
   * Calculate text similarity between transcribed and original text
   * Uses LCS algorithm for better accuracy when words are missing/extra
   */
  compareTexts(transcribedText: string, originalText: string): ComparisonResult {
    const normalize = (str: string) =>
      str.toLowerCase()
        .trim()
        .replace(/[.,!?;:"""''„]/g, '')
        .replace(/\s+/g, ' ');

    const normalized1 = normalize(transcribedText);
    const normalized2 = normalize(originalText);

    const userWords = normalized1.split(' ').filter(w => w.length > 0);
    const originalWords = normalized2.split(' ').filter(w => w.length > 0);

    // Use LCS to find matched words
    const matchedIndices = this.findLCS(userWords, originalWords);
    const matchedSet = new Set(matchedIndices);

    // Word-by-word comparison based on LCS results
    const wordComparison: Record<number, 'correct' | 'incorrect' | 'missing'> = {};

    for (let i = 0; i < originalWords.length; i++) {
      if (matchedSet.has(i)) {
        wordComparison[i] = 'correct';
      } else {
        // Check if user said a similar but incorrect word at this position
        // This is a simplified check; a more robust solution might involve edit distance
        // A more accurate approach for 'incorrect' would be to check if a word from userWords
        // that wasn't part of the LCS match is present at or near this position.
        // For now, we'll mark as 'missing' if not in LCS.
        wordComparison[i] = 'missing';
      }
    }

    // Calculate similarity based on matched words / total original words
    const similarity = originalWords.length > 0
      ? Math.round((matchedIndices.length / originalWords.length) * 100)
      : 0;

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
