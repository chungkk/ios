// Custom hook for fetching single lesson with transcript

import { useState, useEffect, useCallback, useMemo } from 'react';
import { lessonService } from '../services/lesson.service';
import { useAuth } from './useAuth';
import type { Lesson, Sentence } from '../types/lesson.types';

interface UseLessonDataResult {
  lesson: Lesson | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Helper to select translation based on native language
const selectTranslation = (sentence: Sentence, nativeLanguage: string): Sentence => {
  let translation = sentence.translation || '';
  
  if (nativeLanguage === 'en' && sentence.translationEn) {
    translation = sentence.translationEn;
  } else if (nativeLanguage === 'vi' && sentence.translationVi) {
    translation = sentence.translationVi;
  }
  
  return { ...sentence, translation };
};

export const useLessonData = (lessonId: string): UseLessonDataResult => {
  const [rawLesson, setRawLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  
  const nativeLanguage = user?.nativeLanguage || 'vi';

  const fetchData = useCallback(async () => {
    if (!lessonId) {
      console.error('[useLessonData] No lesson ID provided');
      setError(new Error('Lesson ID is required'));
      setLoading(false);
      return;
    }

    try {
      console.log('[useLessonData] Fetching lesson:', lessonId);
      setLoading(true);
      setError(null);

      const data = await lessonService.fetchLessonById(lessonId);
      console.log('[useLessonData] Lesson fetched successfully:', data?.title);
      setRawLesson(data);

      // Increment view count (non-blocking)
      lessonService.incrementViewCount(lessonId).catch(console.error);
    } catch (err) {
      console.error('[useLessonData] Error fetching lesson:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch lesson'));
      setRawLesson(null);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  // Apply translation based on native language
  const lesson = useMemo(() => {
    if (!rawLesson) return null;
    
    return {
      ...rawLesson,
      transcript: rawLesson.transcript.map(sentence => 
        selectTranslation(sentence, nativeLanguage)
      ),
    };
  }, [rawLesson, nativeLanguage]);

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
