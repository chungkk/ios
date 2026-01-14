// User entity types - migrated from Next.js ppgeil project

export type AuthProvider = 'email' | 'google';
export type NativeLanguage = 'vi' | 'en' | 'de';
export type UserLevel = 'beginner' | 'experienced';
export type DifficultyLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string; // Avatar URL
  authProvider: AuthProvider;
  googleId?: string;
  nativeLanguage: NativeLanguage;
  level: UserLevel;
  preferredDifficultyLevel: DifficultyLevel;
  points: number;
  streak: number;
  answerStreak: number;
  lastActiveDate: string; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// Registration request
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  level?: UserLevel;
}

// Login request
export interface LoginRequest {
  email: string;
  password: string;
}

// Profile update request
export interface UpdateProfileRequest {
  name?: string;
  nativeLanguage?: NativeLanguage;
  preferredDifficultyLevel?: DifficultyLevel;
  level?: string;
}
