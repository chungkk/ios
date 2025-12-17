// Custom hook for fetching categories with caching

import { useState, useEffect, useCallback } from 'react';
import { lessonService } from '../services/lesson.service';
import type { Category } from '../types/lesson.types';

interface UseCategoriesResult {
  categories: Category[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useCategories = (activeOnly: boolean = true): UseCategoriesResult => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await lessonService.fetchCategories(activeOnly);
      
      // Sort categories: non-system first, then by order
      const sorted = data.sort((a, b) => {
        if (a.isSystem === b.isSystem) {
          return a.order - b.order;
        }
        return a.isSystem ? 1 : -1;
      });

      setCategories(sorted);
    } catch (err) {
      console.error('[useCategories] Error fetching categories:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    categories,
    loading,
    error,
    refetch,
  };
};

export default useCategories;
