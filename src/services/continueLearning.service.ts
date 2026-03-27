// Continue Learning Service - Fetch in-progress lessons from server API
// Used to show "Continue Learning" section on the home screen
// Data is stored server-side so both mobile and web can share it

import api from './api';

export interface InProgressLesson {
  lessonId: string;
  mode: 'shadowing' | 'dictation';
  progressPercent: number; // 0-100
  studyTime: number;
  lastAccessedAt: string; // ISO 8601
  lessonTitle: string;
  thumbnail: string | undefined;
  level: string;
  categoryName: string;
  videoDuration: number;
}

interface InProgressResponse {
  inProgressLessons: InProgressLesson[];
}

/**
 * Fetch in-progress lessons from server
 * GET /api/progress?type=in-progress
 */
export const getInProgressLessons = async (): Promise<InProgressLesson[]> => {
  try {
    const response = await api.get<InProgressResponse>('/api/progress', {
      params: { type: 'in-progress' },
    });
    return response.data.inProgressLessons || [];
  } catch (error) {
    console.error('[ContinueLearning] Error fetching in-progress lessons:', error);
    return [];
  }
};

export const continueLearningService = {
  getInProgressLessons,
};

export default continueLearningService;
