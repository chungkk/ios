/**
 * @deprecated This service is not currently used by DictationScreen.
 * DictationScreen implements inline word-by-word checking with:
 * - Real-time character-by-character matching
 * - Partial match visualization
 * - Hint reveal system
 * 
 * The checkSentence method here uses a simpler submit-based approach.
 * Consider removing or updating this service to match DictationScreen's features.
 * 
 * Original Dictation Service - Handles sentence validation and scoring
 */

export interface SentenceCheckResult {
  isCorrect: boolean;
  similarity: number; // 0-100 percentage
  correctWords: string[];
  incorrectWords: string[];
  expectedWords: string[];
  userWords: string[];
}

export const dictationService = {
  /**
   * Check user's dictation answer against expected sentence
   * @param userInput - User's typed/spoken answer
   * @param expectedSentence - Correct sentence
   * @returns Validation result with similarity score
   */
  checkSentence: (userInput: string, expectedSentence: string): SentenceCheckResult => {
    // Normalize inputs (lowercase, trim, remove extra spaces)
    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[.,!?;:]/g, ''); // Remove punctuation for comparison
    };

    const normalizedUser = normalizeText(userInput);
    const normalizedExpected = normalizeText(expectedSentence);

    const userWords = normalizedUser.split(' ').filter(w => w.length > 0);
    const expectedWords = normalizedExpected.split(' ').filter(w => w.length > 0);

    // Find correct and incorrect words
    const correctWords: string[] = [];
    const incorrectWords: string[] = [];

    userWords.forEach((userWord, index) => {
      if (expectedWords[index] && userWord === expectedWords[index]) {
        correctWords.push(userWord);
      } else {
        incorrectWords.push(userWord);
      }
    });

    // Calculate similarity percentage
    const totalWords = Math.max(userWords.length, expectedWords.length);
    const similarity = totalWords > 0
      ? Math.round((correctWords.length / totalWords) * 100)
      : 0;

    // Consider "correct" if similarity >= 85%
    const isCorrect = similarity >= 85;

    return {
      isCorrect,
      similarity,
      correctWords,
      incorrectWords,
      expectedWords,
      userWords,
    };
  },

  /**
   * Calculate points based on similarity score
   * @param similarity - Similarity percentage (0-100)
   * @returns Points earned (0-10)
   */
  calculatePoints: (similarity: number): number => {
    if (similarity >= 95) return 10;
    if (similarity >= 85) return 8;
    if (similarity >= 75) return 6;
    if (similarity >= 65) return 4;
    if (similarity >= 50) return 2;
    return 0;
  },
};

export default dictationService;
