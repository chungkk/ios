// Custom hook for fetching single lesson with transcript

import { useState, useEffect, useCallback } from 'react';
import { lessonService } from '../services/lesson.service';
import type { Lesson } from '../types/lesson.types';

interface UseLessonDataResult {
  lesson: Lesson | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useLessonData = (lessonId: string): UseLessonDataResult => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!lessonId) {
      setError(new Error('Lesson ID is required'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await lessonService.fetchLessonById(lessonId);
      setLesson(data);

      // Increment view count (non-blocking)
      lessonService.incrementViewCount(lessonId).catch(console.error);
    } catch (err) {
      console.error('[useLessonData] Error fetching lesson:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch lesson'));
      setLesson(null);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    lesson,
    loading,
    error,
    refetch,
  };
};

export default useLessonData;
