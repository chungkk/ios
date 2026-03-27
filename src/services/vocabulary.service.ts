// Vocabulary service - save and manage user's vocabulary
// Integrates with Next.js /api/vocabulary endpoint

import api from './api';

export interface VocabularyItem {
  id: string;
  word: string;
  translation: string;
  context: string;
  example?: string;
  notes?: string;
  lessonId?: string;
  lessonTitle?: string;
  status: 'new' | 'learning' | 'mastered';
  reviewCount: number;
  lastReviewAt?: string;
  createdAt: string;
  // Extended fields (from website)
  gender?: string;
  plural?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  grammar?: string;
  baseForm?: string;
  nextReviewAt?: string;
  // SRS fields for Anki-like spaced repetition
  srsState?: 'new' | 'learning' | 'review' | 'relearning';
  srsEase?: number;
  srsInterval?: number;
  srsStepIndex?: number;
  srsDue?: string;
  srsReviews?: number;
  srsLapses?: number;
  srsLastReview?: string | null;
}

export interface SaveVocabularyRequest {
  word: string;
  translation: string;
  context?: string;
  lessonId?: string;
  lessonTitle?: string;
  example?: string;
  notes?: string;
  status?: 'new' | 'learning' | 'mastered';
  gender?: string;
  plural?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  grammar?: string;
  baseForm?: string;
}

export interface UpdateVocabularyRequest {
  id: string;
  status?: 'new' | 'learning' | 'mastered';
  notes?: string;
  reviewCount?: number;
  // Extended fields
  translation?: string;
  gender?: string;
  plural?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  grammar?: string;
  baseForm?: string;
  example?: string;
  nextReviewAt?: string;
  // SRS fields
  srsState?: 'new' | 'learning' | 'review' | 'relearning';
  srsEase?: number;
  srsInterval?: number;
  srsStepIndex?: number;
  srsDue?: string;
  srsReviews?: number;
  srsLapses?: number;
  srsLastReview?: string | null;
}

// Dictionary lookup result
export interface DictionaryResult {
  word: string;
  translation?: string;
  gender?: string;
  plural?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  grammar?: string;
  baseForm?: string;
  explanation?: string;
  examples?: Array<string | { de: string; translation?: string }>;
}

// Sentence exercise
export interface SentenceExercise {
  word: string;
  vietnameseSentence: string;
  expectedGerman: string;
}

// Check result
export interface CheckResult {
  isCorrect: boolean;
  grammarScore?: number;
  meaningScore?: number;
  corrections?: string;
  suggestion?: string;
  explanation?: string;
}

/**
 * Fetch all vocabulary for current user
 * GET /api/vocabulary
 */
export const fetchVocabulary = async (lessonId?: string): Promise<VocabularyItem[]> => {
  try {
    const params = lessonId ? { lessonId } : {};
    const response = await api.get<VocabularyItem[]>('/api/vocabulary', { params });
    return response.data;
  } catch (error) {
    console.error('[VocabularyService] Error fetching vocabulary:', error);
    throw error;
  }
};

/**
 * Check if word already exists in user's vocabulary
 * GET /api/vocabulary?word=xxx
 */
export const checkWordExists = async (word: string): Promise<boolean> => {
  try {
    const response = await api.get<{ exists: boolean; vocabulary?: VocabularyItem }>(
      '/api/vocabulary',
      { params: { word } }
    );
    return response.data.exists;
  } catch (error) {
    console.error('[VocabularyService] Error checking word:', error);
    return false;
  }
};

/**
 * Save new vocabulary word
 * POST /api/vocabulary
 */
export const saveVocabulary = async (data: SaveVocabularyRequest): Promise<VocabularyItem> => {
  try {
    const response = await api.post<{ success: boolean; vocabulary: VocabularyItem }>(
      '/api/vocabulary',
      data
    );
    return response.data.vocabulary;
  } catch (error: any) {
    // Handle "word already exists" error
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Word already saved');
    }
    console.error('[VocabularyService] Error saving vocabulary:', error);
    throw error;
  }
};

/**
 * Update vocabulary item (status, notes, reviewCount)
 * PUT /api/vocabulary
 */
export const updateVocabulary = async (data: UpdateVocabularyRequest): Promise<VocabularyItem> => {
  try {
    const response = await api.put<{ success: boolean; vocabulary: VocabularyItem }>(
      '/api/vocabulary',
      data
    );
    return response.data.vocabulary;
  } catch (error) {
    console.error('[VocabularyService] Error updating vocabulary:', error);
    throw error;
  }
};

/**
 * Delete vocabulary item
 * DELETE /api/vocabulary?id=xxx
 */
export const deleteVocabulary = async (id: string): Promise<void> => {
  try {
    await api.delete('/api/vocabulary', { params: { id } });
  } catch (error) {
    console.error('[VocabularyService] Error deleting vocabulary:', error);
    throw error;
  }
};

/**
 * Delete vocabulary by word
 * DELETE /api/vocabulary?word=xxx
 */
export const deleteVocabularyByWord = async (word: string): Promise<void> => {
  try {
    await api.delete('/api/vocabulary', { params: { word } });
  } catch (error) {
    console.error('[VocabularyService] Error deleting vocabulary:', error);
    throw error;
  }
};

/**
 * Dictionary lookup - AI-powered word information
 * POST /api/dictionary
 */
export const lookupDictionary = async (word: string, targetLang: string = 'vi'): Promise<DictionaryResult> => {
  try {
    const response = await api.post<DictionaryResult | { data: DictionaryResult }>(
      '/api/dictionary',
      { word: word.trim(), targetLang }
    );
    const data = response.data;
    // Handle both { data: {...} } and direct format
    return (data as any).data || data;
  } catch (error) {
    console.error('[VocabularyService] Dictionary lookup error:', error);
    throw error;
  }
};

/**
 * Check typed German word against expected
 * POST /api/vocab-translate-exercise (action: 'check-word')
 */
export const checkTypedWord = async (
  input: string,
  expectedWord: string,
  translation: string,
  partOfSpeech?: string,
  baseForm?: string,
): Promise<{ isCorrect: boolean; explanation?: string }> => {
  try {
    const response = await api.post('/api/vocab-translate-exercise', {
      action: 'check-word',
      input: input.trim(),
      expectedWord,
      translation,
      partOfSpeech: partOfSpeech || '',
      baseForm: baseForm || '',
    });
    return response.data;
  } catch (error) {
    console.error('[VocabularyService] Check word error:', error);
    // Fallback to simple normalize check
    const normalize = (s: string) =>
      s.toLowerCase().replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').trim();
    const correct = normalize(input) === normalize(expectedWord) ||
      (!!baseForm && normalize(input) === normalize(baseForm));
    return { isCorrect: correct };
  }
};

/**
 * Check German sentence written by user
 * POST /api/check-sentence
 */
export const checkSentence = async (
  sentence: string,
  vocabulary: string,
  targetLang: string = 'vi',
): Promise<CheckResult> => {
  try {
    const response = await api.post('/api/check-sentence', {
      sentence: sentence.trim(),
      vocabulary,
      targetLang,
    });
    return response.data;
  } catch (error) {
    console.error('[VocabularyService] Check sentence error:', error);
    throw error;
  }
};

/**
 * Generate sentence translation exercises
 * POST /api/vocab-translate-exercise (action: 'generate')
 */
export const generateSentenceExercises = async (
  words: Array<{ word: string; translation: string }>,
): Promise<SentenceExercise[]> => {
  try {
    const response = await api.post('/api/vocab-translate-exercise', {
      action: 'generate',
      words,
    });
    return response.data.exercises || [];
  } catch (error) {
    console.error('[VocabularyService] Generate exercises error:', error);
    return [];
  }
};

/**
 * Check sentence translation (Vietnamese → German)
 * POST /api/vocab-translate-exercise (action: 'check')
 */
export const checkSentenceTranslation = async (
  vietnameseSentence: string,
  germanTranslation: string,
  expectedGerman: string,
  vocabulary: string,
): Promise<CheckResult> => {
  try {
    const response = await api.post('/api/vocab-translate-exercise', {
      action: 'check',
      vietnameseSentence,
      germanTranslation: germanTranslation.trim(),
      expectedGerman,
      vocabulary,
    });
    return response.data;
  } catch (error) {
    console.error('[VocabularyService] Check sentence translation error:', error);
    throw error;
  }
};

/**
 * Fetch vocabulary stats for chart
 * GET /api/vocabulary-stats?period=week|month
 */
export const fetchVocabStats = async (period: 'week' | 'month' = 'week') => {
  try {
    const response = await api.get('/api/vocabulary-stats', { params: { period } });
    return response.data;
  } catch (error) {
    console.error('[VocabularyService] Fetch stats error:', error);
    return null;
  }
};

export const vocabularyService = {
  fetchVocabulary,
  checkWordExists,
  saveVocabulary,
  updateVocabulary,
  deleteVocabulary,
  deleteVocabularyByWord,
  lookupDictionary,
  checkTypedWord,
  checkSentence,
  generateSentenceExercises,
  checkSentenceTranslation,
  fetchVocabStats,
};

export default vocabularyService;
