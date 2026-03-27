// Hook for fetching in-progress lessons from the server
// Used by HomeScreen to show "Continue Learning" section

import { useState, useCallback } from 'react';
import { continueLearningService, InProgressLesson } from '../services/continueLearning.service';

interface UseContinueLearningResult {
  inProgressLessons: InProgressLesson[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export const useContinueLearning = (): UseContinueLearningResult => {
  const [inProgressLessons, setInProgressLessons] = useState<InProgressLesson[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const lessons = await continueLearningService.getInProgressLessons();
      setInProgressLessons(lessons);
    } catch (error) {
      console.error('[useContinueLearning] Error:', error);
      setInProgressLessons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    inProgressLessons,
    loading,
    refetch: fetchData,
  };
};

// Re-export for convenience
export type { InProgressLesson };

export default useContinueLearning;
