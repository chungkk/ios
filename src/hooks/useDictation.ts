import { useState, useCallback } from 'react';
import { Sentence } from '../types/lesson.types';
import dictationService, { SentenceCheckResult } from '../services/dictation.service';

/**
 * @deprecated This hook is not currently used by DictationScreen.
 * DictationScreen implements its own logic with additional features:
 * - Real-time word-by-word matching (not submit-based)
 * - Hint system with reveal and point deduction
 * - Partial character matching visualization
 * - Progress persistence with debounced save
 * 
 * Consider removing this file or updating it to match DictationScreen's features
 * if you want to consolidate the logic.
 * 
 * Original Dictation Hook - Manages dictation state, sentence navigation, and answer checking
 */

interface UseDictationProps {
  sentences: Sentence[];
  onComplete?: (accuracy: number, pointsEarned: number) => void;
}

export const useDictation = ({ sentences, onComplete }: UseDictationProps) => {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [checkResult, setCheckResult] = useState<SentenceCheckResult | null>(null);
  const [completedSentences, setCompletedSentences] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentSentence = sentences[currentSentenceIndex];
  const totalSentences = sentences.length;
  const completedCount = completedSentences.length;
  const progress = totalSentences > 0 ? (completedCount / totalSentences) * 100 : 0;

  /**
   * Submit current answer for checking
   */
  const submitAnswer = useCallback(() => {
    if (!currentSentence || !userInput.trim()) return;

    const result = dictationService.checkSentence(userInput, currentSentence.text);
    setCheckResult(result);
    setIsSubmitted(true);

    // Add to completed sentences
    setCompletedSentences(prev => [...prev, result.similarity]);
  }, [currentSentence, userInput]);

  /**
   * Move to next sentence
   */
  const nextSentence = useCallback(() => {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
      setUserInput('');
      setCheckResult(null);
      setIsSubmitted(false);
    } else {
      // Session complete
      const averageAccuracy = completedSentences.length > 0
        ? Math.round(completedSentences.reduce((sum, score) => sum + score, 0) / completedSentences.length)
        : 0;

      const totalPoints = completedSentences.reduce((sum, score) => {
        return sum + dictationService.calculatePoints(score);
      }, 0);

      if (onComplete) {
        onComplete(averageAccuracy, totalPoints);
      }
    }
  }, [currentSentenceIndex, sentences.length, completedSentences, onComplete]);

  /**
   * Move to previous sentence
   */
  const previousSentence = useCallback(() => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(prev => prev - 1);
      setUserInput('');
      setCheckResult(null);
      setIsSubmitted(false);
    }
  }, [currentSentenceIndex]);

  /**
   * Reset answer for current sentence
   */
  const resetAnswer = useCallback(() => {
    setUserInput('');
    setCheckResult(null);
    setIsSubmitted(false);
  }, []);

  /**
   * Skip current sentence (mark as incomplete)
   */
  const skipSentence = useCallback(() => {
    setCompletedSentences(prev => [...prev, 0]); // 0% similarity for skipped
    nextSentence();
  }, [nextSentence]);

  /**
   * Restart dictation session
   */
  const restart = useCallback(() => {
    setCurrentSentenceIndex(0);
    setUserInput('');
    setCheckResult(null);
    setCompletedSentences([]);
    setIsSubmitted(false);
  }, []);

  return {
    // State
    currentSentence,
    currentSentenceIndex,
    totalSentences,
    userInput,
    checkResult,
    isSubmitted,
    completedCount,
    progress,

    // Actions
    setUserInput,
    submitAnswer,
    nextSentence,
    previousSentence,
    resetAnswer,
    skipSentence,
    restart,

    // Computed
    canGoBack: currentSentenceIndex > 0,
    canGoNext: currentSentenceIndex < sentences.length - 1,
    isComplete: completedCount === totalSentences,
    hasAnswer: userInput.trim().length > 0,
  };
};

export default useDictation;
