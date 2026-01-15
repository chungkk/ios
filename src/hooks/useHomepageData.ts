// Custom hook for fetching homepage data - optimized single API call
// Replaces separate useLessons + useCategories for homepage

import { useState, useEffect, useCallback } from 'react';
import { homepageService, CategoryWithLessons } from '../services/homepage.service';
import type { Category } from '../types/lesson.types';
import type { UserUnlockInfo } from '../types/unlock.types';

type DifficultyFilter = 'all' | 'beginner' | 'experienced';

interface UseHomepageDataResult {
  categories: Category[];
  categoriesWithLessons: Record<string, CategoryWithLessons>;
  userUnlockInfo: UserUnlockInfo | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useHomepageData = (
  difficultyFilter: DifficultyFilter = 'all',
  lessonsPerCategory: number = 6
): UseHomepageDataResult => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesWithLessons, setCategoriesWithLessons] = useState<Record<string, CategoryWithLessons>>({});
  const [userUnlockInfo, setUserUnlockInfo] = useState<UserUnlockInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (isInitial: boolean = false) => {
    try {
      // Only show full loading on initial load
      if (isInitial) {
        setLoading(true);
      }
      setError(null);

      const data = await homepageService.fetchHomepageData(difficultyFilter, lessonsPerCategory);

      setCategories(data.categories || []);
      setCategoriesWithLessons(data.categoriesWithLessons || {});
      setUserUnlockInfo(data.userUnlockInfo || null);
    } catch (err) {
      console.error('[useHomepageData] Error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch homepage data'));
      setCategories([]);
      setCategoriesWithLessons({});
      setUserUnlockInfo(null);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [difficultyFilter, lessonsPerCategory]);

  useEffect(() => {
    fetchData(initialLoad);
  }, [difficultyFilter, lessonsPerCategory, fetchData, initialLoad]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    categories,
    categoriesWithLessons,
    userUnlockInfo,
    loading,
    error,
    refetch,
  };
};

export default useHomepageData;

