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
  const wasPlayingRef = useRef<boolean>(false);

  // Reset flag so onSentenceEnd can be called again for the same sentence
  const resetSentenceEndFlag = useCallback(() => {
    sentenceEndCalledRef.current = -1;
  }, []);

  // Reset sentenceEndCalledRef when playback resumes (isPlaying: false -> true)
  // This fixes the bug where auto-stop doesn't work when user clicks play again
  // after the video was stopped by auto-stop
  // 
  // IMPORTANT: We add a delay before resetting the flag to allow the video seek
  // operation to complete. Without this delay, when user clicks on a sentence:
  // 1. setIsPlaying(true) is called, which resets sentenceEndCalledRef immediately
  // 2. But the video seek hasn't completed yet (still at previous endTime)
  // 3. The polling interval detects currentTime >= endTime and triggers auto-stop
  // 4. This causes the play button click to appear "broken"
  const resetDelayRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isPlaying && !wasPlayingRef.current) {
      // Playback just started/resumed - delay reset to allow seek to complete
      if (__DEV__) {
        console.log('[useTranscriptSync] Playback resumed, scheduling sentenceEndCalledRef reset');
      }
      // Clear any pending reset
      if (resetDelayRef.current) {
        clearTimeout(resetDelayRef.current);
      }
      // Delay reset by 300ms to allow video seek to complete
      resetDelayRef.current = setTimeout(() => {
        if (__DEV__) {
          console.log('[useTranscriptSync] Resetting sentenceEndCalledRef after delay');
        }
        sentenceEndCalledRef.current = -1;
        resetDelayRef.current = null;
      }, 300);
    }
    wasPlayingRef.current = isPlaying;

    // Cleanup timeout on unmount
    return () => {
      if (resetDelayRef.current) {
        clearTimeout(resetDelayRef.current);
      }
    };
  }, [isPlaying]);

  const updateActiveSentence = useCallback(async () => {
    try {
      const currentTime = await getCurrentTime();

      if (currentTime === null || currentTime === undefined) {
        return;
      }

      const newIndex = findActiveSentence(transcript, currentTime);

      // Check if current sentence has ended
      // Case 1: Time has passed endTime of current sentence
      // Case 2: We're transitioning from sentence A to sentence B (newIndex > activeSentenceIndex)
      //         This happens when timestamps are continuous (sentenceB.startTime === sentenceA.endTime)
      if (activeSentenceIndex >= 0 && activeSentenceIndex < transcript.length) {
        const currentSentence = transcript[activeSentenceIndex];
        const shouldTriggerEnd = currentSentence && (
          // Time passed endTime
          currentTime >= currentSentence.endTime ||
          // Or transitioning to a later sentence (sentence changed forward)
          (newIndex > activeSentenceIndex && newIndex !== -1)
        );

        if (shouldTriggerEnd && sentenceEndCalledRef.current !== activeSentenceIndex) {
          if (__DEV__) {
            console.log('[useTranscriptSync] Sentence ended:', {
              sentenceIndex: activeSentenceIndex,
              currentTime: currentTime.toFixed(2),
              endTime: currentSentence.endTime.toFixed(2),
              newIndex,
            });
          }
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

