// API response types - shared across all services

import {User} from './user.types';

// Authentication responses
export interface AuthResponse {
  token: string; // JWT token (7-day expiration)
  user: User;
}

export interface MeResponse {
  user: User;
}

export interface PointsResponse {
  points: number;
}

// Standard error response
export interface ApiError {
  message: string;
  error?: string; // Technical details (dev mode only)
}

// Progress save response
export interface ProgressResponse {
  progress: {
    id: string;
    userId: string;
    lessonId: string;
    mode: 'shadowing' | 'dictation';
    completed: boolean;
    pointsEarned: number;
    studyTime: number;
    accuracy?: number;
    completedAt: string;
  };
  user: User; // Updated user with new points, streak
}

// Daily phrase explanation response
export interface PhraseExplanationResponse {
  explanation: string;
}
