// Progress tracking types

export interface Progress {
  id: string;
  userId: string;
  lessonId: string;
  mode: 'shadowing' | 'dictation';
  completed: boolean;
  pointsEarned: number;
  studyTime: number; // seconds
  accuracy?: number; // 0-100 (for dictation mode only)
  completedAt: string; // ISO 8601
}

export interface SaveProgressRequest {
  lessonId: string;
  mode: 'shadowing' | 'dictation';
  completed: boolean;
  pointsEarned: number;
  studyTime: number;
  accuracy?: number;
}

export interface SaveProgressResponse {
  progress: Progress;
  user: {
    points: number;
    streak: number;
    answerStreak: number;
  };
}
