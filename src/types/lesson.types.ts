// Lesson entity types - migrated from Next.js ppgeil project

export type DifficultyLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2';

export interface Category {
  slug: string;
  name: string;
  description?: string;
  order: number;
  isSystem: boolean;
  isActive: boolean;
}

export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface Sentence {
  text: string;
  start: number; // seconds (decimal) - raw from API
  end: number; // seconds (decimal) - raw from API
  startTime: number; // normalized for app use
  endTime: number; // normalized for app use
  wordTimings?: WordTiming[];
  translation?: string; // Combined translation (selected by user's language)
  translationEn?: string;
  translationVi?: string;
}

export interface Lesson {
  id: string;
  title: string;
  youtubeUrl: string;
  videoId: string;
  thumbnail?: string;
  videoDuration: number; // seconds
  level: DifficultyLevel;
  category: Category;
  transcript: Sentence[];
  source: string; // 'youtube'
  viewCount: number;
  featured?: boolean;
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// API response types
export interface LessonsResponse {
  lessons: Lesson[];
  total: number;
}

export interface LessonDetailResponse {
  lesson: Lesson;
}

export interface CategoriesResponse {
  categories: Category[];
}

// Lesson list filters
export interface LessonFilters {
  category?: string; // category slug
  difficulty?: 'all' | 'beginner' | 'experienced';
  limit?: number;
  skip?: number;
  activeOnly?: boolean;
}

// Cache key types
export type LessonCacheKey = `lessons_home_${string}`; // e.g., lessons_home_beginner
export type LessonDetailCacheKey = `lesson_${string}`; // e.g., lesson_abc123
