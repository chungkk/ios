/**
 * Text Similarity Algorithm
 * Migrated from ppgeil/lib/textSimilarity.js
 * Uses Levenshtein distance for string comparison
 */

/**
 * Calculate Levenshtein distance between two strings
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
};

/**
 * Normalize text for comparison
 * - Convert to lowercase
 * - Remove extra whitespace
 * - Remove punctuation
 * - Keep German special characters (äöüß)
 */
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\wäöüß\s]/gi, '')
    .replace(/\s+/g, ' ');
};

/**
 * Calculate similarity percentage between two texts
 */
export const calculateSimilarity = (text1: string, text2: string): number => {
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);

  if (!normalized1 && !normalized2) return 100;
  if (!normalized1 || !normalized2) return 0;

  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.max(0, Math.min(100, similarity));
};

/**
 * Calculate word-level similarity
 */
export const calculateWordSimilarity = (userText: string, expectedText: string): number => {
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

export interface WordMatch {
  original: string;
  spoken: string;
  similarity: number;
  matched: boolean;
}

export interface CompareResult {
  overallSimilarity: number;
  wordAccuracy: number;
  matchedWords: number;
  totalWords: number;
  wordMatches: WordMatch[];
  isPassed: boolean;
}

/**
 * Compare words and find matches (detailed comparison)
 * Migrated from ppgeil/lib/textSimilarity.js
 */
export const compareTexts = (originalText: string, spokenText: string): CompareResult => {
  const original = normalizeText(originalText);
  const spoken = normalizeText(spokenText);

  const originalWords = original.split(' ').filter(w => w.length > 0);
  const spokenWords = spoken.split(' ').filter(w => w.length > 0);

  let matchedWords = 0;
  const wordMatches: WordMatch[] = [];

  originalWords.forEach((originalWord) => {
    let bestMatch: { word: string; similarity: number } | null = null;
    let bestSimilarity = 0;

    spokenWords.forEach((spokenWord) => {
      const wordSimilarity = calculateSimilarity(originalWord, spokenWord);
      if (wordSimilarity > bestSimilarity) {
        bestSimilarity = wordSimilarity;
        bestMatch = { word: spokenWord, similarity: wordSimilarity };
      }
    });

    // Count as matched if similarity > 70%
    if (bestMatch && bestSimilarity > 70) {
      matchedWords++;
      wordMatches.push({
        original: originalWord,
        spoken: bestMatch.word,
        similarity: bestSimilarity,
        matched: true
      });
    } else {
      wordMatches.push({
        original: originalWord,
        spoken: bestMatch?.word || '',
        similarity: bestSimilarity,
        matched: false
      });
    }
  });

  const overallSimilarity = calculateSimilarity(original, spoken);
  const wordAccuracy = originalWords.length > 0
    ? (matchedWords / originalWords.length) * 100
    : 0;

  return {
    overallSimilarity: Math.round(overallSimilarity * 10) / 10,
    wordAccuracy: Math.round(wordAccuracy * 10) / 10,
    matchedWords,
    totalWords: originalWords.length,
    wordMatches,
    isPassed: overallSimilarity >= 80
  };
};

/**
 * Get score based on similarity
 */
export const getSimilarityScore = (similarity: number): number => {
  return similarity >= 80 ? 1 : -0.5;
};

/**
 * Get feedback message based on similarity
 */
export const getSimilarityFeedback = (similarity: number, language: 'de' | 'vi' | 'en' = 'vi'): string => {
  const messages: Record<string, Record<string, string>> = {
    de: {
      excellent: 'Ausgezeichnet! Perfekte Aussprache!',
      great: 'Sehr gut! Fast perfekt!',
      good: 'Gut gemacht!',
      fair: 'Nicht schlecht, aber du kannst es besser!',
      poor: 'Versuche es noch einmal!'
    },
    vi: {
      excellent: 'Xuất sắc! Phát âm hoàn hảo!',
      great: 'Rất tốt! Gần như hoàn hảo!',
      good: 'Tốt lắm!',
      fair: 'Không tệ, nhưng bạn có thể làm tốt hơn!',
      poor: 'Hãy thử lại!'
    },
    en: {
      excellent: 'Excellent! Perfect pronunciation!',
      great: 'Very good! Almost perfect!',
      good: 'Well done!',
      fair: 'Not bad, but you can do better!',
      poor: 'Try again!'
    }
  };

  const lang = messages[language] || messages.vi;

  if (similarity >= 95) return lang.excellent;
  if (similarity >= 85) return lang.great;
  if (similarity >= 80) return lang.good;
  if (similarity >= 60) return lang.fair;
  return lang.poor;
};

export default {
  levenshteinDistance,
  normalizeText,
  calculateSimilarity,
  calculateWordSimilarity,
  compareTexts,
  getSimilarityScore,
  getSimilarityFeedback,
};
