/**
 * Text Similarity Algorithm
 * Migrated from ppgeil/lib/textSimilarity.js
 * Uses Levenshtein distance for string comparison
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Edit distance (number of operations needed to transform str1 into str2)
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[len1][len2];
};

/**
 * Calculate similarity percentage between two strings
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity percentage (0-100)
 */
export const calculateSimilarity = (str1: string, str2: string): number => {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 100;
  
  const similarity = ((maxLength - distance) / maxLength) * 100;
  return Math.round(Math.max(0, similarity));
};

/**
 * Calculate word-level similarity (more forgiving than character-level)
 * @param userText - User's input
 * @param expectedText - Expected text
 * @returns Similarity percentage (0-100)
 */
export const calculateWordSimilarity = (userText: string, expectedText: string): number => {
  const normalizeText = (text: string) => text.toLowerCase().trim().replace(/\s+/g, ' ');
  
  const userWords = normalizeText(userText).split(' ').filter(w => w.length > 0);
  const expectedWords = normalizeText(expectedText).split(' ').filter(w => w.length > 0);
  
  if (expectedWords.length === 0) return 0;
  
  let correctWords = 0;
  for (let i = 0; i < Math.min(userWords.length, expectedWords.length); i++) {
    if (userWords[i] === expectedWords[i]) {
      correctWords++;
    }
  }
  
  return Math.round((correctWords / expectedWords.length) * 100);
};

/**
 * Compare two strings and return detailed match information
 * @param userText - User's input
 * @param expectedText - Expected text
 * @returns Match details with word-level comparison
 */
export const compareTexts = (
  userText: string,
  expectedText: string
): {
  similarity: number;
  wordSimilarity: number;
  matchingWords: string[];
  missingWords: string[];
  extraWords: string[];
} => {
  const normalizeText = (text: string) => text.toLowerCase().trim().replace(/\s+/g, ' ');
  
  const userWords = normalizeText(userText).split(' ').filter(w => w.length > 0);
  const expectedWords = normalizeText(expectedText).split(' ').filter(w => w.length > 0);
  
  const matchingWords: string[] = [];
  const missingWords: string[] = [];
  const extraWords: string[] = [];
  
  // Find matching and missing words
  expectedWords.forEach((word, index) => {
    if (userWords[index] === word) {
      matchingWords.push(word);
    } else {
      missingWords.push(word);
    }
  });
  
  // Find extra words
  if (userWords.length > expectedWords.length) {
    extraWords.push(...userWords.slice(expectedWords.length));
  }
  
  const similarity = calculateSimilarity(userText, expectedText);
  const wordSimilarity = calculateWordSimilarity(userText, expectedText);
  
  return {
    similarity,
    wordSimilarity,
    matchingWords,
    missingWords,
    extraWords,
  };
};

export default {
  levenshteinDistance,
  calculateSimilarity,
  calculateWordSimilarity,
  compareTexts,
};
