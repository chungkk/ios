// Statistics service - Track and aggregate user learning statistics

import { saveData, getData } from './storage.service';

const STORAGE_KEY_DAILY_STATS = 'daily_statistics';

export interface DailyStats {
  date: string; // YYYY-MM-DD
  shadowing: {
    sentencesCompleted: number;
    correctCount: number;
    totalAttempts: number;
    pointsEarned: number;
    studyTimeSeconds: number;
  };
  dictation: {
    sentencesCompleted: number;
    correctCount: number;
    errorCount: number;
    totalAttempts: number;
    pointsEarned: number;
    studyTimeSeconds: number;
  };
}

export interface StatsSummary {
  today: DailyStats;
  thisWeek: DailyStats;
  thisMonth: DailyStats;
}

const getEmptyDayStats = (date: string): DailyStats => ({
  date,
  shadowing: {
    sentencesCompleted: 0,
    correctCount: 0,
    totalAttempts: 0,
    pointsEarned: 0,
    studyTimeSeconds: 0,
  },
  dictation: {
    sentencesCompleted: 0,
    correctCount: 0,
    errorCount: 0,
    totalAttempts: 0,
    pointsEarned: 0,
    studyTimeSeconds: 0,
  },
});

const getTodayDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const getWeekStartDate = (): Date => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as week start
  return new Date(now.setDate(diff));
};

const getMonthStartDate = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

/**
 * Get all stored daily statistics
 */
export const getAllDailyStats = async (): Promise<Record<string, DailyStats>> => {
  const stats = await getData<Record<string, DailyStats>>(STORAGE_KEY_DAILY_STATS);
  return stats || {};
};

/**
 * Save daily statistics
 */
export const saveDailyStats = async (stats: Record<string, DailyStats>): Promise<void> => {
  await saveData(STORAGE_KEY_DAILY_STATS, stats);
};

/**
 * Get today's statistics
 */
export const getTodayStats = async (): Promise<DailyStats> => {
  const allStats = await getAllDailyStats();
  const today = getTodayDateString();
  return allStats[today] || getEmptyDayStats(today);
};

/**
 * Update statistics after completing a shadowing session
 */
export const recordShadowingSession = async (data: {
  sentencesCompleted: number;
  correctCount: number;
  totalAttempts: number;
  pointsEarned: number;
  studyTimeSeconds: number;
}): Promise<void> => {
  const allStats = await getAllDailyStats();
  const today = getTodayDateString();
  
  if (!allStats[today]) {
    allStats[today] = getEmptyDayStats(today);
  }
  
  allStats[today].shadowing.sentencesCompleted += data.sentencesCompleted;
  allStats[today].shadowing.correctCount += data.correctCount;
  allStats[today].shadowing.totalAttempts += data.totalAttempts;
  allStats[today].shadowing.pointsEarned += data.pointsEarned;
  allStats[today].shadowing.studyTimeSeconds += data.studyTimeSeconds;
  
  await saveDailyStats(allStats);
  console.log('[StatisticsService] Recorded shadowing session:', data);
};

/**
 * Update statistics after completing a dictation session
 */
export const recordDictationSession = async (data: {
  sentencesCompleted: number;
  correctCount: number;
  errorCount: number;
  totalAttempts: number;
  pointsEarned: number;
  studyTimeSeconds: number;
}): Promise<void> => {
  const allStats = await getAllDailyStats();
  const today = getTodayDateString();
  
  if (!allStats[today]) {
    allStats[today] = getEmptyDayStats(today);
  }
  
  allStats[today].dictation.sentencesCompleted += data.sentencesCompleted;
  allStats[today].dictation.correctCount += data.correctCount;
  allStats[today].dictation.errorCount += data.errorCount;
  allStats[today].dictation.totalAttempts += data.totalAttempts;
  allStats[today].dictation.pointsEarned += data.pointsEarned;
  allStats[today].dictation.studyTimeSeconds += data.studyTimeSeconds;
  
  await saveDailyStats(allStats);
  console.log('[StatisticsService] Recorded dictation session:', data);
};

/**
 * Record a single dictation sentence completion (real-time tracking)
 */
export const recordSingleDictationSentence = async (data: {
  correct: boolean;
  pointsEarned: number;
}): Promise<void> => {
  const allStats = await getAllDailyStats();
  const today = getTodayDateString();
  
  if (!allStats[today]) {
    allStats[today] = getEmptyDayStats(today);
  }
  
  allStats[today].dictation.sentencesCompleted += 1;
  allStats[today].dictation.totalAttempts += 1;
  if (data.correct) {
    allStats[today].dictation.correctCount += 1;
  } else {
    allStats[today].dictation.errorCount += 1;
  }
  allStats[today].dictation.pointsEarned += data.pointsEarned;
  
  await saveDailyStats(allStats);
  console.log('[StatisticsService] Recorded single dictation sentence');
};

/**
 * Record a single shadowing sentence completion (real-time tracking)
 */
export const recordSingleShadowingSentence = async (data: {
  correct: boolean;
  pointsEarned: number;
}): Promise<void> => {
  const allStats = await getAllDailyStats();
  const today = getTodayDateString();
  
  if (!allStats[today]) {
    allStats[today] = getEmptyDayStats(today);
  }
  
  allStats[today].shadowing.sentencesCompleted += 1;
  allStats[today].shadowing.totalAttempts += 1;
  if (data.correct) {
    allStats[today].shadowing.correctCount += 1;
  }
  allStats[today].shadowing.pointsEarned += data.pointsEarned;
  
  await saveDailyStats(allStats);
  console.log('[StatisticsService] Recorded single shadowing sentence');
};

/**
 * Aggregate stats for a date range
 */
const aggregateStats = (allStats: Record<string, DailyStats>, startDate: Date, endDate: Date): DailyStats => {
  const result = getEmptyDayStats('aggregated');
  
  Object.entries(allStats).forEach(([dateStr, dayStats]) => {
    const date = new Date(dateStr);
    if (date >= startDate && date <= endDate) {
      // Shadowing
      result.shadowing.sentencesCompleted += dayStats.shadowing.sentencesCompleted;
      result.shadowing.correctCount += dayStats.shadowing.correctCount;
      result.shadowing.totalAttempts += dayStats.shadowing.totalAttempts;
      result.shadowing.pointsEarned += dayStats.shadowing.pointsEarned;
      result.shadowing.studyTimeSeconds += dayStats.shadowing.studyTimeSeconds;
      
      // Dictation
      result.dictation.sentencesCompleted += dayStats.dictation.sentencesCompleted;
      result.dictation.correctCount += dayStats.dictation.correctCount;
      result.dictation.errorCount += dayStats.dictation.errorCount;
      result.dictation.totalAttempts += dayStats.dictation.totalAttempts;
      result.dictation.pointsEarned += dayStats.dictation.pointsEarned;
      result.dictation.studyTimeSeconds += dayStats.dictation.studyTimeSeconds;
    }
  });
  
  return result;
};

/**
 * Get summary statistics (today, this week, this month)
 */
export const getStatsSummary = async (): Promise<StatsSummary> => {
  const allStats = await getAllDailyStats();
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const weekStart = getWeekStartDate();
  weekStart.setHours(0, 0, 0, 0);
  
  const monthStart = getMonthStartDate();
  monthStart.setHours(0, 0, 0, 0);
  
  return {
    today: aggregateStats(allStats, todayStart, today),
    thisWeek: aggregateStats(allStats, weekStart, today),
    thisMonth: aggregateStats(allStats, monthStart, today),
  };
};

/**
 * Clean up old statistics (keep only last 90 days)
 */
export const cleanupOldStats = async (): Promise<void> => {
  const allStats = await getAllDailyStats();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  
  const cleanedStats: Record<string, DailyStats> = {};
  
  Object.entries(allStats).forEach(([dateStr, stats]) => {
    const date = new Date(dateStr);
    if (date >= cutoffDate) {
      cleanedStats[dateStr] = stats;
    }
  });
  
  await saveDailyStats(cleanedStats);
  console.log('[StatisticsService] Cleaned up old stats');
};

export const statisticsService = {
  getTodayStats,
  getStatsSummary,
  recordShadowingSession,
  recordDictationSession,
  recordSingleShadowingSentence,
  recordSingleDictationSentence,
  cleanupOldStats,
  getAllDailyStats,
};

export default statisticsService;
