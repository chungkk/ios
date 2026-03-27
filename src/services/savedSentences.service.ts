// Saved Sentences Service
// AsyncStorage-based local storage for bookmarked sentences from lessons

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'saved_sentences';

export interface SavedSentence {
  id: string;           // `${lessonId}_${sentenceIndex}`
  text: string;         // German sentence
  translation?: string; // Vietnamese/English translation
  lessonId: string;
  lessonTitle: string;
  savedAt: string;      // ISO timestamp
}

/**
 * Get all saved sentences
 */
export const getSavedSentences = async (): Promise<SavedSentence[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('[SavedSentences] Error getting saved sentences:', error);
    return [];
  }
};

/**
 * Save a sentence (bookmark it)
 */
export const saveSentence = async (sentence: SavedSentence): Promise<void> => {
  try {
    const existing = await getSavedSentences();
    // Avoid duplicates
    if (existing.some(s => s.id === sentence.id)) return;
    const updated = [sentence, ...existing];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[SavedSentences] Error saving sentence:', error);
    throw error;
  }
};

/**
 * Remove a saved sentence by ID
 */
export const removeSentence = async (id: string): Promise<void> => {
  try {
    const existing = await getSavedSentences();
    const updated = existing.filter(s => s.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[SavedSentences] Error removing sentence:', error);
    throw error;
  }
};

/**
 * Check if a sentence is saved
 */
export const isSentenceSaved = async (id: string): Promise<boolean> => {
  const sentences = await getSavedSentences();
  return sentences.some(s => s.id === id);
};

/**
 * Get a Set of all saved sentence IDs (for quick lookup in UI)
 */
export const getSavedSentenceIds = async (): Promise<Set<string>> => {
  const sentences = await getSavedSentences();
  return new Set(sentences.map(s => s.id));
};

export const savedSentencesService = {
  getSavedSentences,
  saveSentence,
  removeSentence,
  isSentenceSaved,
  getSavedSentenceIds,
};

export default savedSentencesService;
