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
}

export interface UpdateVocabularyRequest {
  id: string;
  status?: 'new' | 'learning' | 'mastered';
  notes?: string;
  reviewCount?: number;
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

export const vocabularyService = {
  fetchVocabulary,
  checkWordExists,
  saveVocabulary,
  updateVocabulary,
  deleteVocabulary,
  deleteVocabularyByWord,
};

export default vocabularyService;
