import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { progressService } from '../services/progress.service';

const MAX_STUDY_TIME = 24 * 60 * 60; // 24 hours in seconds
const SAVE_INTERVAL_MS = 10000; // 10 seconds
const TIMER_UPDATE_MS = 500; // Update UI every 500ms for smoother display

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
  isPlaying: _isPlaying, // Keep for API compatibility but not used for timer control
  lessonId,
  mode,
  initialStudyTime = 0,
}: UseStudyTimerOptions): UseStudyTimerReturn => {
  const [displayTime, setDisplayTime] = useState(initialStudyTime);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Use refs to track actual time (immune to re-renders and interval delays)
  const startTimeRef = useRef<number | null>(null);
  const baseTimeRef = useRef(initialStudyTime); // Time loaded from storage
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadedRef = useRef(false);

  // Calculate current study time based on elapsed time since start
  const getCurrentStudyTime = useCallback(() => {
    if (!startTimeRef.current) return baseTimeRef.current;
    const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    return Math.min(baseTimeRef.current + elapsedSeconds, MAX_STUDY_TIME);
  }, []);

  // Format time to HH:MM:SS
  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Save study time to server and local storage
  const saveStudyTime = useCallback(async () => {
    if (!lessonId) return;

    const currentTime = getCurrentStudyTime();

    try {
      // Save to local storage first (offline support)
      const storageKey = `studyTime_${lessonId}_${mode}`;
      await AsyncStorage.setItem(storageKey, currentTime.toString());

      // Try to save to server
      await progressService.saveProgress({
        lessonId,
        mode,
        studyTime: currentTime,
      });
    } catch (error) {
      console.error('Error saving study time:', error);
    }
  }, [lessonId, mode, getCurrentStudyTime]);

  // Load initial study time from local storage
  useEffect(() => {
    const loadStudyTime = async () => {
      try {
        const storageKey = `studyTime_${lessonId}_${mode}`;
        const savedTime = await AsyncStorage.getItem(storageKey);
        if (savedTime) {
          const parsedTime = parseInt(savedTime, 10);
          if (!isNaN(parsedTime) && parsedTime > initialStudyTime) {
            baseTimeRef.current = parsedTime;
            setDisplayTime(parsedTime);
          }
        }
      } catch (error) {
        console.error('Error loading study time:', error);
      } finally {
        isLoadedRef.current = true;
        // Start timer after loading
        startTimeRef.current = Date.now();
        setIsTimerRunning(true);
      }
    };

    loadStudyTime();
  }, [lessonId, mode, initialStudyTime]);

  // Update display time at regular intervals (using Date.now() for accuracy)
  useEffect(() => {
    if (!isTimerRunning) return;

    // Update display immediately
    setDisplayTime(getCurrentStudyTime());

    // Set up interval to update display
    timerIntervalRef.current = setInterval(() => {
      const currentTime = getCurrentStudyTime();
      setDisplayTime(currentTime);

      // Stop at max time
      if (currentTime >= MAX_STUDY_TIME && timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }, TIMER_UPDATE_MS);

    // Cleanup on unmount or when timer stops
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isTimerRunning, getCurrentStudyTime]);

  // Periodic save
  useEffect(() => {
    if (!isTimerRunning) return;

    saveIntervalRef.current = setInterval(saveStudyTime, SAVE_INTERVAL_MS);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      // Save on cleanup (when leaving screen)
      saveStudyTime();
    };
  }, [isTimerRunning, saveStudyTime]);

  return {
    studyTime: displayTime,
    isTimerRunning,
    formattedTime: formatTime(displayTime),
  };
};

export default useStudyTimer;
