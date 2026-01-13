import { DailyPhrase } from '../types/phrase.types';
import dailyPhrases from '../assets/data/dailyPhrases.json';
import phraseExplanations from '../assets/data/phraseExplanations.json';

/**
 * Phrase Utilities
 * Helper functions for daily phrase rotation based on day-of-year calculation
 */

/**
 * Calculate day of year (1-365/366)
 * @param date - Date object
 * @returns Day of year number
 */
const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

/**
 * Get today's phrase based on day-of-year rotation
 * @returns DailyPhrase object for today
 */
export const getTodaysPhrase = (): DailyPhrase => {
  const today = new Date();
  const dayOfYear = getDayOfYear(today);
  const phraseIndex = dayOfYear % dailyPhrases.length;
  
  const phrase = dailyPhrases[phraseIndex] as DailyPhrase;
  
  // Attach cached explanation if available
  const phraseKey = phrase.phrase;
  const explanationData = phraseExplanations as Record<string, { en?: string; vi?: string }>;
  
  if (explanationData[phraseKey]) {
    phrase.explanation = explanationData[phraseKey];
  }
  
  return phrase;
};

/**
 * Get phrase for a specific date offset from today
 * @param offsetDays - Number of days offset (negative for past, positive for future)
 * @returns DailyPhrase object for the offset date
 */
export const getPhraseForOffset = (offsetDays: number): DailyPhrase => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + offsetDays);
  
  const dayOfYear = getDayOfYear(targetDate);
  const phraseIndex = dayOfYear % dailyPhrases.length;
  
  const phrase = dailyPhrases[phraseIndex] as DailyPhrase;
  
  // Attach cached explanation if available
  const phraseKey = phrase.phrase;
  const explanationData = phraseExplanations as Record<string, { en?: string; vi?: string }>;
  
  if (explanationData[phraseKey]) {
    phrase.explanation = explanationData[phraseKey];
  }
  
  return phrase;
};

/**
 * Get phrase for a specific date
 * @param date - Target date
 * @returns DailyPhrase object for that date
 */
export const getPhraseForDate = (date: Date): DailyPhrase => {
  const dayOfYear = getDayOfYear(date);
  const phraseIndex = dayOfYear % dailyPhrases.length;
  
  const phrase = dailyPhrases[phraseIndex] as DailyPhrase;
  
  // Attach cached explanation if available
  const phraseKey = phrase.phrase;
  const explanationData = phraseExplanations as Record<string, { en?: string; vi?: string }>;
  
  if (explanationData[phraseKey]) {
    phrase.explanation = explanationData[phraseKey];
  }
  
  return phrase;
};

/**
 * Get total number of phrases available
 * @returns Total phrase count
 */
export const getTotalPhrases = (): number => {
  return dailyPhrases.length;
};

/**
 * Format date for display (e.g., "December 17, 2025")
 * @param date - Date object
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date string
 */
export const formatPhraseDate = (date: Date, locale: string = 'en-US'): string => {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
