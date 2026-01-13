// Homepage data service - optimized API for fetching categories with lessons
// Single API call instead of N+1 requests (migrated from Next.js /api/homepage-data)

import api from './api';
import type { Category, Lesson } from '../types/lesson.types';

export interface CategoryWithLessons {
  category: Category;
  lessons: Lesson[];
  totalCount: number;
}

export interface HomepageDataResponse {
  categories: Category[];
  categoriesWithLessons: Record<string, CategoryWithLessons>;
}

/**
 * Fetch homepage data with categories and lessons in single request
 * GET /api/homepage-data
 */
export const fetchHomepageData = async (
  difficulty: 'all' | 'beginner' | 'experienced' = 'all',
  lessonsPerCategory: number = 6
): Promise<HomepageDataResponse> => {
  try {
    console.log('[HomepageService] Fetching homepage data:', { difficulty, lessonsPerCategory });
    
    const response = await api.get<HomepageDataResponse>('/api/homepage-data', {
      params: {
        difficulty,
        limit: lessonsPerCategory,
      },
    });

    console.log('[HomepageService] Received categories:', response.data.categories?.length);
    
    return response.data;
  } catch (error) {
    console.error('[HomepageService] Error fetching homepage data:', error);
    throw error;
  }
};

export const homepageService = {
  fetchHomepageData,
};

export default homepageService;
