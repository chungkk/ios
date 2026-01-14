// Lesson service - API calls for lessons and categories
// Integrates with Next.js backend API (ppgeil/pages/api)

import api from './api';
import type {
  Lesson,
  LessonsResponse,
  CategoriesResponse,
  LessonFilters,
  Category,
} from '../types/lesson.types';

/**
 * Fetch lessons with filters
 * GET /api/lessons
 */
export const fetchLessons = async (filters: LessonFilters = {}): Promise<LessonsResponse> => {
  try {
    // Fetch from API (cache disabled for development)
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
    // Fetch from API (cache disabled for development)
    console.log('[LessonService] Fetching categories from API');
    const response = await api.get<CategoriesResponse>('/api/article-categories', {
      params: {
        activeOnly: activeOnly ? 'true' : 'false',
      },
    });

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
    // Fetch lesson metadata from API (cache disabled for development)
    console.log('[LessonService] Fetching lesson from API:', lessonId);
    const response = await api.get<any>(`/api/lessons/${lessonId}`);
    const lessonData = response.data;

    // Fetch transcript from JSON file (lesson.json path)
    if (lessonData.json) {
      console.log('[LessonService] Fetching transcript from:', lessonData.json);
      try {
        const transcriptResponse = await api.get<any[]>(lessonData.json);
        console.log('[LessonService] Transcript response received, items:', transcriptResponse.data?.length);
        console.log('[LessonService] First item sample:', JSON.stringify(transcriptResponse.data?.[0]).substring(0, 200));
        
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
        console.log('[LessonService] First transformed sentence:', transformedTranscript[0]?.text.substring(0, 50));
      } catch (transcriptError) {
        console.error('[LessonService] Error fetching transcript:', transcriptError);
        console.error('[LessonService] Error details:', JSON.stringify(transcriptError));
        // Set empty transcript if fetch fails
        lessonData.transcript = [];
      }
    } else {
      console.warn('[LessonService] No transcript JSON path found for lesson:', lessonId);
      lessonData.transcript = [];
    }

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
