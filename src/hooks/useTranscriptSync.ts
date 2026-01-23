// Custom hook for transcript synchronization with video playback
// Polling implementation with 300ms accuracy (optimized for battery)
// Supports word-level karaoke highlighting

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Sentence } from '../types/lesson.types';
import { findActiveSentence } from '../utils/transcriptUtils';

interface UseTranscriptSyncParams {
  transcript: Sentence[];
  isPlaying: boolean;
  getCurrentTime: () => Promise<number>;
  onSentenceEnd?: (sentenceIndex: number) => void;
}

interface UseTranscriptSyncResult {
  activeSentenceIndex: number;
  activeWordIndex: number; // For word-level karaoke highlighting
  resetSentenceEndFlag: () => void;
}

const SYNC_INTERVAL = 150; // 150ms polling interval for smoother karaoke

// Find active word index based on current time and wordTimings
const findActiveWordIndex = (sentence: Sentence | undefined, currentTime: number): number => {
  if (!sentence || !sentence.wordTimings || sentence.wordTimings.length === 0) {
    return -1;
  }

  for (let i = 0; i < sentence.wordTimings.length; i++) {
    const wordTiming = sentence.wordTimings[i];
    if (currentTime >= wordTiming.start && currentTime < wordTiming.end) {
      return i;
    }
  }

  // If past all words, return last word
  const lastWord = sentence.wordTimings[sentence.wordTimings.length - 1];
  if (currentTime >= lastWord.end) {
    return sentence.wordTimings.length - 1;
  }

  return -1;
};

export const useTranscriptSync = ({
  transcript,
  isPlaying,
  getCurrentTime,
  onSentenceEnd,
}: UseTranscriptSyncParams): UseTranscriptSyncResult => {
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(-1);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sentenceEndCalledRef = useRef<number>(-1);

  // Reset flag so onSentenceEnd can be called again for the same sentence
  const resetSentenceEndFlag = useCallback(() => {
    sentenceEndCalledRef.current = -1;
  }, []);

  const updateActiveSentence = useCallback(async () => {
    try {
      const currentTime = await getCurrentTime();

      if (currentTime === null || currentTime === undefined) {
        return;
      }

      const newIndex = findActiveSentence(transcript, currentTime);

      // Check if current sentence has ended (time passed endTime)
      if (activeSentenceIndex >= 0 && activeSentenceIndex < transcript.length) {
        const currentSentence = transcript[activeSentenceIndex];
        if (currentSentence && currentTime >= currentSentence.endTime && sentenceEndCalledRef.current !== activeSentenceIndex) {
          sentenceEndCalledRef.current = activeSentenceIndex;
          onSentenceEnd?.(activeSentenceIndex);
        }
      }

      // Update active sentence index
      if (newIndex !== activeSentenceIndex) {
        if (__DEV__) {
          console.log('[useTranscriptSync] Active sentence changed:', {
            index: newIndex,
            time: currentTime.toFixed(2),
            text: transcript[newIndex]?.text?.substring(0, 50) || 'N/A'
          });
        }
        setActiveSentenceIndex(newIndex);
        setActiveWordIndex(-1); // Reset word index when sentence changes
      }

      // Update active word index for karaoke effect
      if (newIndex >= 0 && newIndex < transcript.length) {
        const currentSentence = transcript[newIndex];
        const newWordIndex = findActiveWordIndex(currentSentence, currentTime);
        if (newWordIndex !== activeWordIndex) {
          setActiveWordIndex(newWordIndex);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('[useTranscriptSync] Error updating active sentence:', error);
    }
  }, [transcript, activeSentenceIndex, activeWordIndex, getCurrentTime, onSentenceEnd]);

  useEffect(() => {
    if (!isPlaying || !transcript || transcript.length === 0) {
      // Clear interval when not playing
      if (intervalRef.current) {
        if (__DEV__) console.log('[useTranscriptSync] Stopping polling (isPlaying:', isPlaying, ')');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (__DEV__) console.log('[useTranscriptSync] Starting polling with', transcript.length, 'sentences');

    // Start polling interval
    intervalRef.current = setInterval(() => {
      updateActiveSentence();
    }, SYNC_INTERVAL);

    // Immediate update when play starts
    updateActiveSentence();

    // Cleanup on unmount or when playing stops
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, transcript, updateActiveSentence]);

  return {
    activeSentenceIndex,
    activeWordIndex,
    resetSentenceEndFlag,
  };
};

export default useTranscriptSync;

