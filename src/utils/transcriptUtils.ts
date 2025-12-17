// Transcript utility functions for video synchronization

import type { Sentence } from '../types/lesson.types';

/**
 * Find the active sentence based on current video time
 * Returns index of sentence that should be highlighted
 */
export const findActiveSentence = (
  transcript: Sentence[],
  currentTime: number
): number => {
  if (!transcript || transcript.length === 0) {
    return -1;
  }

  for (let i = 0; i < transcript.length; i++) {
    const sentence = transcript[i];
    const nextSentence = transcript[i + 1];
    
    const sentenceEnd = nextSentence ? nextSentence.startTime : Infinity;
    
    if (currentTime >= sentence.startTime && currentTime < sentenceEnd) {
      return i;
    }
  }

  // If past all sentences, return last sentence
  if (currentTime >= transcript[transcript.length - 1].startTime) {
    return transcript.length - 1;
  }

  return -1;
};

/**
 * Format timestamp in MM:SS format
 */
export const formatTimestamp = (seconds: number): string => {
  if (!seconds || seconds < 0) return '00:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Format timestamp in HH:MM:SS format (for long videos)
 */
export const formatLongTimestamp = (seconds: number): string => {
  if (!seconds || seconds < 0) return '00:00:00';

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Calculate progress percentage
 */
export const calculateProgress = (currentTime: number, duration: number): number => {
  if (!duration || duration <= 0) return 0;
  
  const progress = (currentTime / duration) * 100;
  return Math.min(Math.max(progress, 0), 100); // Clamp between 0-100
};

/**
 * Check if video is near end (within 5 seconds)
 */
export const isNearEnd = (currentTime: number, duration: number): boolean => {
  if (!duration) return false;
  return (duration - currentTime) <= 5;
};
