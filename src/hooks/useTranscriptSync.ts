// Custom hook for transcript synchronization with video playback
// Polling implementation with 200ms accuracy (SC-005 requirement)

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
  activeWord: number; // For word-level highlighting (future feature)
  resetSentenceEndFlag: () => void;
}

const SYNC_INTERVAL = 200; // 200ms polling interval for ±200ms accuracy

export const useTranscriptSync = ({
  transcript,
  isPlaying,
  getCurrentTime,
  onSentenceEnd,
}: UseTranscriptSyncParams): UseTranscriptSyncResult => {
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(-1);
  const [_activeWord, _setActiveWord] = useState<number>(-1); // For future word-level highlighting
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
      
      if (newIndex !== activeSentenceIndex) {
        console.log('[useTranscriptSync] Active sentence changed:', {
          index: newIndex,
          time: currentTime.toFixed(2),
          text: transcript[newIndex]?.text?.substring(0, 50) || 'N/A'
        });
        setActiveSentenceIndex(newIndex);
      }
    } catch (error) {
      console.error('[useTranscriptSync] Error updating active sentence:', error);
    }
  }, [transcript, activeSentenceIndex, getCurrentTime, onSentenceEnd]);

  useEffect(() => {
    if (!isPlaying || !transcript || transcript.length === 0) {
      // Clear interval when not playing
      if (intervalRef.current) {
        console.log('[useTranscriptSync] Stopping polling (isPlaying:', isPlaying, ')');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('[useTranscriptSync] Starting polling with', transcript.length, 'sentences');
    
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
    activeWord: _activeWord, // For future word-level highlighting
    resetSentenceEndFlag,
  };
};

export default useTranscriptSync;
