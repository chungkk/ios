// Lesson service - API calls for lessons and categories
// Integrates with Next.js backend API (ppgeil/pages/api)

import api from './api';
import type {
  Lesson,
  LessonsResponse,
  LessonDetailResponse,
  CategoriesResponse,
  LessonFilters,
  Category,
} from '../types/lesson.types';
import { saveCache, getCache, STORAGE_KEYS } from './storage.service';

const LESSON_CACHE_TTL = 3600; // 1 hour in seconds

/**
 * Fetch lessons with filters
 * GET /api/lessons
 */
export const fetchLessons = async (filters: LessonFilters = {}): Promise<LessonsResponse> => {
  try {
    // Build cache key
    const cacheKey = `${STORAGE_KEYS.LESSONS_CACHE}${filters.difficulty || 'all'}_${filters.category || 'all'}`;
    
    // Check cache first
    const cached = await getCache<LessonsResponse>(cacheKey);
    if (cached) {
      console.log('[LessonService] Returning cached lessons:', cacheKey);
      return cached;
    }

    // Fetch from API
    console.log('[LessonService] Fetching lessons from API:', filters);
    const response = await api.get<LessonsResponse>('/api/lessons', {
      params: {
        category: filters.category,
        difficulty: filters.difficulty,
        limit: filters.limit || 10,
        skip: filters.skip || 0,
        activeOnly: filters.activeOnly !== false ? 'true' : 'false',
      },
    });

    // Cache the result
    await saveCache(cacheKey, response.data, LESSON_CACHE_TTL);

    return response.data;
  } catch (error) {
    console.error('[LessonService] Error fetching lessons:', error);
    throw error;
  }
};

/**
 * Fetch categories
 * GET /api/article-categories
 */
export const fetchCategories = async (activeOnly: boolean = true): Promise<Category[]> => {
  try {
    // Check cache first
    const cacheKey = STORAGE_KEYS.CATEGORIES_CACHE;
    const cached = await getCache<CategoriesResponse>(cacheKey);
    if (cached) {
      console.log('[LessonService] Returning cached categories');
      return cached.categories;
    }

    // Fetch from API
    console.log('[LessonService] Fetching categories from API');
    const response = await api.get<CategoriesResponse>('/api/article-categories', {
      params: {
        activeOnly: activeOnly ? 'true' : 'false',
      },
    });

    // Cache for 24 hours
    await saveCache(cacheKey, response.data, 86400); // 24 hours

    return response.data.categories;
  } catch (error) {
    console.error('[LessonService] Error fetching categories:', error);
    throw error;
  }
};

/**
 * Fetch single lesson by ID with full transcript
 * GET /api/lessons/:id
 */
export const fetchLessonById = async (lessonId: string): Promise<Lesson> => {
  try {
    // Check cache first
    const cacheKey = `lesson_${lessonId}`;
    const cached = await getCache<Lesson>(cacheKey);
    if (cached) {
      console.log('[LessonService] Returning cached lesson:', lessonId);
      return cached;
    }

    // Fetch lesson metadata from API
    console.log('[LessonService] Fetching lesson from API:', lessonId);
    const response = await api.get<any>(`/api/lessons/${lessonId}`);
    const lessonData = response.data;

    // Fetch transcript from JSON file (lesson.json path)
    if (lessonData.json) {
      console.log('[LessonService] Fetching transcript from:', lessonData.json);
      try {
        const transcriptResponse = await api.get<any[]>(lessonData.json);
        
        // Transform transcript: normalize field names (start/end -> startTime/endTime)
        // and select appropriate translation based on user's language preference
        const transformedTranscript = transcriptResponse.data.map((item: any) => ({
          text: item.text,
          start: item.start,
          end: item.end,
          startTime: item.start, // Normalized for backward compatibility
          endTime: item.end,     // Normalized for backward compatibility
          wordTimings: item.wordTimings || [],
          translation: item.translationVi || item.translation || '', // Default to Vietnamese
          translationEn: item.translationEn,
          translationVi: item.translationVi,
        }));
        
        lessonData.transcript = transformedTranscript;
        console.log('[LessonService] Transcript loaded, sentences:', transformedTranscript.length);
      } catch (transcriptError) {
        console.error('[LessonService] Error fetching transcript:', transcriptError);
        // Set empty transcript if fetch fails
        lessonData.transcript = [];
      }
    } else {
      console.warn('[LessonService] No transcript JSON path found for lesson:', lessonId);
      lessonData.transcript = [];
    }

    // Cache the complete lesson with transcript for 1 hour
    await saveCache(cacheKey, lessonData, LESSON_CACHE_TTL);

    return lessonData;
  } catch (error) {
    console.error('[LessonService] Error fetching lesson:', error);
    throw error;
  }
};

/**
 * Increment lesson view count
 * POST /api/lessons/:id/view
 */
export const incrementViewCount = async (lessonId: string): Promise<number> => {
  try {
    console.log('[LessonService] Incrementing view count:', lessonId);
    const response = await api.post<{ viewCount: number }>(`/api/lessons/${lessonId}/view`);
    return response.data.viewCount;
  } catch (error) {
    // Non-critical, log but don't throw
    console.error('[LessonService] Error incrementing view count:', error);
    return 0;
  }
};

export const lessonService = {
  fetchLessons,
  fetchCategories,
  fetchLessonById,
  incrementViewCount,
};

export default lessonService;
