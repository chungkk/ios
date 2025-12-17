// Custom hook for transcript synchronization with video playback
// Polling implementation with 200ms accuracy (SC-005 requirement)

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Sentence } from '../types/lesson.types';
import { findActiveSentence } from '../utils/transcriptUtils';

interface UseTranscriptSyncParams {
  transcript: Sentence[];
  isPlaying: boolean;
  getCurrentTime: () => Promise<number>;
}

interface UseTranscriptSyncResult {
  activeSentenceIndex: number;
  activeWord: number; // For word-level highlighting (future feature)
}

const SYNC_INTERVAL = 200; // 200ms polling interval for ±200ms accuracy

export const useTranscriptSync = ({
  transcript,
  isPlaying,
  getCurrentTime,
}: UseTranscriptSyncParams): UseTranscriptSyncResult => {
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(-1);
  const [_activeWord, _setActiveWord] = useState<number>(-1); // For future word-level highlighting
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateActiveSentence = useCallback(async () => {
    try {
      const currentTime = await getCurrentTime();
      
      if (currentTime === null || currentTime === undefined) {
        return;
      }

      const newIndex = findActiveSentence(transcript, currentTime);
      
      if (newIndex !== activeSentenceIndex) {
        setActiveSentenceIndex(newIndex);
      }
    } catch (error) {
      console.error('[useTranscriptSync] Error updating active sentence:', error);
    }
  }, [transcript, activeSentenceIndex, getCurrentTime]);

  useEffect(() => {
    if (!isPlaying || !transcript || transcript.length === 0) {
      // Clear interval when not playing
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

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
  };
};

export default useTranscriptSync;
