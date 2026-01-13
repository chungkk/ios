// Custom hook for fetching lessons with caching and loading states
// Replaces SWR from Next.js with React hooks + cache

import { useState, useEffect, useCallback } from 'react';
import { lessonService } from '../services/lesson.service';
import type { Lesson, LessonFilters } from '../types/lesson.types';

interface UseLessonsResult {
  lessons: Lesson[];
  total: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useLessons = (filters: LessonFilters = {}): UseLessonsResult => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const categoryFilter = filters.category;
  const difficultyFilter = filters.difficulty;
  const limitFilter = filters.limit;
  const skipFilter = filters.skip;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await lessonService.fetchLessons({
        category: categoryFilter,
        difficulty: difficultyFilter,
        limit: limitFilter,
        skip: skipFilter,
      });
      
      setLessons(response.lessons);
      setTotal(response.total);
    } catch (err) {
      console.error('[useLessons] Error fetching lessons:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch lessons'));
      setLessons([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, difficultyFilter, limitFilter, skipFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    lessons,
    total,
    loading,
    error,
    refetch,
  };
};

export default useLessons;
