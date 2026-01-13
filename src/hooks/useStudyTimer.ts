import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { progressService } from '../services/progress.service';

const MAX_STUDY_TIME = 24 * 60 * 60; // 24 hours in seconds
const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
const SAVE_INTERVAL_MS = 10000; // 10 seconds

interface UseStudyTimerOptions {
  isPlaying: boolean;
  lessonId: string;
  mode: 'dictation' | 'shadowing';
  initialStudyTime?: number;
}

interface UseStudyTimerReturn {
  studyTime: number;
  isTimerRunning: boolean;
  formattedTime: string;
}

export const useStudyTimer = ({
  isPlaying,
  lessonId,
  mode,
  initialStudyTime = 0,
}: UseStudyTimerOptions): UseStudyTimerReturn => {
  const [studyTime, setStudyTime] = useState(initialStudyTime);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedTimerRef = useRef(false);
  const studyTimeRef = useRef(studyTime);

  // Keep ref in sync with state
  useEffect(() => {
    studyTimeRef.current = studyTime;
  }, [studyTime]);

  // Format time to HH:MM:SS
  const formattedTime = useCallback(() => {
    const totalSeconds = Math.min(studyTime, MAX_STUDY_TIME);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [studyTime]);

  // Save study time to server and local storage
  const saveStudyTime = useCallback(async () => {
    if (!lessonId) return;

    const validatedStudyTime = Math.min(studyTimeRef.current, MAX_STUDY_TIME);

    try {
      // Save to local storage first (offline support)
      const storageKey = `studyTime_${lessonId}_${mode}`;
      await AsyncStorage.setItem(storageKey, validatedStudyTime.toString());

      // Try to save to server
      await progressService.saveProgress({
        lessonId,
        mode,
        studyTime: validatedStudyTime,
      });
    } catch (error) {
      console.error('Error saving study time:', error);
    }
  }, [lessonId, mode]);

  // Load initial study time from local storage
  useEffect(() => {
    const loadStudyTime = async () => {
      try {
        const storageKey = `studyTime_${lessonId}_${mode}`;
        const savedTime = await AsyncStorage.getItem(storageKey);
        if (savedTime) {
          const parsedTime = parseInt(savedTime, 10);
          if (!isNaN(parsedTime) && parsedTime > initialStudyTime) {
            setStudyTime(parsedTime);
          }
        }
      } catch (error) {
        console.error('Error loading study time:', error);
      }
    };

    loadStudyTime();
  }, [lessonId, mode, initialStudyTime]);

  // Start timer interval
  const startTimerInterval = useCallback(() => {
    if (timerIntervalRef.current) return;

    timerIntervalRef.current = setInterval(() => {
      setStudyTime(prev => {
        if (prev >= MAX_STUDY_TIME) {
          return MAX_STUDY_TIME;
        }
        return prev + 1;
      });
    }, 1000);
  }, []);

  // Stop timer interval
  const stopTimerInterval = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Main timer logic - start on first play
  useEffect(() => {
    if (isPlaying && !hasStartedTimerRef.current) {
      hasStartedTimerRef.current = true;
      setIsTimerRunning(true);
      setLastActivityTime(Date.now());
      startTimerInterval();
    }
  }, [isPlaying, startTimerInterval]);

  // Track activity and handle inactivity timeout
  useEffect(() => {
    if (!hasStartedTimerRef.current) return;

    // Clear previous timeout
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Resume timer if stopped due to inactivity
    if (!isTimerRunning && hasStartedTimerRef.current) {
      setIsTimerRunning(true);
      startTimerInterval();
    }

    // Set inactivity timeout
    inactivityTimeoutRef.current = setTimeout(() => {
      setIsTimerRunning(false);
      stopTimerInterval();
      saveStudyTime();
    }, INACTIVITY_TIMEOUT_MS);

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [lastActivityTime, isTimerRunning, stopTimerInterval, saveStudyTime, startTimerInterval]);

  // Update activity time when playing changes
  useEffect(() => {
    if (isPlaying) {
      setLastActivityTime(Date.now());
    }
  }, [isPlaying]);

  // Periodic save
  useEffect(() => {
    saveIntervalRef.current = setInterval(saveStudyTime, SAVE_INTERVAL_MS);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      // Save on cleanup
      saveStudyTime();
    };
  }, [saveStudyTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimerInterval();
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [stopTimerInterval]);

  return {
    studyTime,
    isTimerRunning,
    formattedTime: formattedTime(),
  };
};

export default useStudyTimer;
