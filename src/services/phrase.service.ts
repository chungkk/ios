import api from './api';
import { 
  PhraseExplanationRequest, 
  PhraseExplanationResponse 
} from '../types/phrase.types';

/**
 * Phrase Service
 * Handles API calls for daily phrase explanations
 */

export const phraseService = {
  /**
   * Fetch AI-generated explanation for a German phrase
   * @param request - Phrase details and target language
   * @returns Explanation text in the target language
   */
  fetchPhraseExplanation: async (
    request: PhraseExplanationRequest
  ): Promise<string> => {
    try {
      const response = await api.post<PhraseExplanationResponse>(
        '/api/explain-phrase',
        request
      );
      return response.data.explanation;
    } catch (error) {
      console.error('Error fetching phrase explanation:', error);
      throw error;
    }
  },
};

export default phraseService;
