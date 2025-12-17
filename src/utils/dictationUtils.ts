import { calculateWordSimilarity } from './textSimilarity';

/**
 * Dictation Utilities
 * Helper functions for dictation mode
 */

export interface WordMatch {
  word: string;
  isCorrect: boolean;
  position: number;
}

/**
 * Mask text by replacing characters with underscores
 * Used to show sentence structure without revealing answer
 * @param text - Text to mask
 * @param showFirstLetter - Whether to show first letter of each word
 * @returns Masked text
 */
export const maskText = (text: string, showFirstLetter: boolean = true): string => {
  const words = text.split(' ');
  return words
    .map(word => {
      if (word.length === 0) return '';
      if (showFirstLetter) {
        return word[0] + '_'.repeat(word.length - 1);
      }
      return '_'.repeat(word.length);
    })
    .join(' ');
};

/**
 * Compare user input with expected sentence word by word
 * @param userInput - User's typed/spoken input
 * @param expectedSentence - Correct sentence
 * @returns Array of word matches with correctness flags
 */
export const compareWordByWord = (
  userInput: string,
  expectedSentence: string
): WordMatch[] => {
  const normalizeText = (text: string) => 
    text.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,!?;:]/g, '');
  
  const userWords = normalizeText(userInput).split(' ').filter(w => w.length > 0);
  const expectedWords = normalizeText(expectedSentence).split(' ').filter(w => w.length > 0);
  
  const matches: WordMatch[] = [];
  
  // Compare each position
  const maxLength = Math.max(userWords.length, expectedWords.length);
  for (let i = 0; i < maxLength; i++) {
    const userWord = userWords[i] || '';
    const expectedWord = expectedWords[i] || '';
    
    matches.push({
      word: userWord || expectedWord,
      isCorrect: userWord === expectedWord && userWord.length > 0,
      position: i,
    });
  }
  
  return matches;
};

/**
 * Render completed sentence with color coding
 * @param wordMatches - Word match results
 * @returns Formatted string with correctness indicators
 */
export const renderCompletedSentence = (wordMatches: WordMatch[]): string => {
  return wordMatches
    .map(match => (match.isCorrect ? `✓ ${match.word}` : `✗ ${match.word}`))
    .join(' ');
};

/**
 * Calculate overall accuracy for dictation session
 * @param completedSentences - Array of similarity scores for each sentence
 * @returns Average accuracy percentage
 */
export const calculateSessionAccuracy = (completedSentences: number[]): number => {
  if (completedSentences.length === 0) return 0;
  
  const total = completedSentences.reduce((sum, score) => sum + score, 0);
  return Math.round(total / completedSentences.length);
};

/**
 * Wrapper for text similarity calculation
 * @param userText - User's input
 * @param expectedText - Expected text
 * @returns Similarity percentage (0-100)
 */
export const calculateSimilarity = (userText: string, expectedText: string): number => {
  return calculateWordSimilarity(userText, expectedText);
};

/**
 * Format similarity score for display
 * @param similarity - Similarity percentage
 * @returns Formatted string (e.g., "85%")
 */
export const formatSimilarity = (similarity: number): string => {
  return `${Math.round(similarity)}%`;
};

/**
 * Determine if answer passes threshold
 * @param similarity - Similarity percentage
 * @param threshold - Minimum passing score (default: 85)
 * @returns Whether answer passes
 */
export const isPassingScore = (similarity: number, threshold: number = 85): boolean => {
  return similarity >= threshold;
};

/**
 * Get feedback message based on score
 * @param similarity - Similarity percentage
 * @returns Feedback message
 */
export const getFeedbackMessage = (similarity: number): string => {
  if (similarity >= 95) return 'Perfect! 🎉';
  if (similarity >= 85) return 'Excellent! ✨';
  if (similarity >= 75) return 'Good job! 👍';
  if (similarity >= 65) return 'Not bad! Keep trying. 💪';
  if (similarity >= 50) return 'Keep practicing! 📚';
  return 'Try again! 🔄';
};

export default {
  maskText,
  compareWordByWord,
  renderCompletedSentence,
  calculateSessionAccuracy,
  calculateSimilarity,
  formatSimilarity,
  isPassingScore,
  getFeedbackMessage,
};
