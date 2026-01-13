// Statistics service - Track and aggregate user learning statistics
// Neo-Retro Design - Improved data structure

import { saveData, getData } from './storage.service';

const STORAGE_KEY_DAILY_STATS = 'daily_statistics_v2';

// ============================================
// TYPES
// ============================================

export interface ShadowingStats {
  recorded: number;           // Số câu đã ghi âm
  correct: number;            // Số câu ≥80% similarity
  incorrect: number;          // Số câu <80% similarity
  totalSimilarity: number;    // Tổng % similarity để tính trung bình
  pointsEarned: number;
  studyTimeSeconds: number;
}

export interface DictationStats {
  completed: number;          // Số câu hoàn thành đúng
  hintsUsed: number;          // Số hint đã dùng
  pointsEarned: number;
  studyTimeSeconds: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  shadowing: ShadowingStats;
  dictation: DictationStats;
  pointsDeducted: number; // Số kim cương bị trừ trong ngày
}

export interface StatsSummary {
  today: DailyStats;
  thisWeek: DailyStats;
  thisMonth: DailyStats;
}

export interface WeeklyActivity {
  dates: string[];        // 7 ngày gần nhất (YYYY-MM-DD)
  shadowing: number[];    // Số câu mỗi ngày
  dictation: number[];    // Số câu mỗi ngày
}

// ============================================
// HELPERS
// ============================================

const getEmptyDayStats = (date: string): DailyStats => ({
  date,
  shadowing: {
    recorded: 0,
    correct: 0,
    incorrect: 0,
    totalSimilarity: 0,
    pointsEarned: 0,
    studyTimeSeconds: 0,
  },
  dictation: {
    completed: 0,
    hintsUsed: 0,
    pointsEarned: 0,
    studyTimeSeconds: 0,
  },
  pointsDeducted: 0,
});

const getTodayDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const getWeekStartDate = (): Date => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as week start
  const result = new Date(now);
  result.setDate(diff);
  return result;
};

const getMonthStartDate = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

// ============================================
// STORAGE OPERATIONS
// ============================================

export const getAllDailyStats = async (): Promise<Record<string, DailyStats>> => {
  const stats = await getData<Record<string, DailyStats>>(STORAGE_KEY_DAILY_STATS);
  return stats || {};
};

export const saveDailyStats = async (stats: Record<string, DailyStats>): Promise<void> => {
  await saveData(STORAGE_KEY_DAILY_STATS, stats);
};

export const getTodayStats = async (): Promise<DailyStats> => {
  const allStats = await getAllDailyStats();
  const today = getTodayDateString();
  return allStats[today] || getEmptyDayStats(today);
};

// ============================================
// SHADOWING RECORDING
// ============================================

/**
 * Record a single shadowing attempt with similarity score
 */
export const recordShadowingAttempt = async (data: {
  similarity: number;     // 0-100
  isCorrect: boolean;     // similarity >= 80
  pointsEarned: number;
}): Promise<void> => {
  try {
    const allStats = await getAllDailyStats();
    const today = getTodayDateString();

    if (!allStats[today]) {
      allStats[today] = getEmptyDayStats(today);
    }

    allStats[today].shadowing.recorded += 1;
    allStats[today].shadowing.totalSimilarity += data.similarity;

    if (data.isCorrect) {
      allStats[today].shadowing.correct += 1;
    } else {
      allStats[today].shadowing.incorrect += 1;
    }

    allStats[today].shadowing.pointsEarned += data.pointsEarned;

    await saveDailyStats(allStats);
    console.log('[StatisticsService] Recorded shadowing attempt:', {
      similarity: data.similarity,
      isCorrect: data.isCorrect,
      todayStats: allStats[today].shadowing,
    });
  } catch (error) {
    console.error('[StatisticsService] Error recording shadowing attempt:', error);
  }
};

/**
 * Record shadowing study time
 */
export const recordShadowingStudyTime = async (seconds: number): Promise<void> => {
  try {
    const allStats = await getAllDailyStats();
    const today = getTodayDateString();

    if (!allStats[today]) {
      allStats[today] = getEmptyDayStats(today);
    }

    allStats[today].shadowing.studyTimeSeconds += seconds;
    await saveDailyStats(allStats);
  } catch (error) {
    console.error('[StatisticsService] Error recording shadowing study time:', error);
  }
};

// Legacy function for backward compatibility
export const recordSingleShadowingSentence = async (data: {
  correct: boolean;
  pointsEarned: number;
}): Promise<void> => {
  await recordShadowingAttempt({
    similarity: data.correct ? 80 : 50, // estimate
    isCorrect: data.correct,
    pointsEarned: data.pointsEarned,
  });
};

// ============================================
// DICTATION RECORDING
// ============================================

/**
 * Record a dictation sentence completion
 */
export const recordDictationComplete = async (data: {
  hintsUsed: number;
  pointsEarned: number;
}): Promise<void> => {
  try {
    const allStats = await getAllDailyStats();
    const today = getTodayDateString();

    if (!allStats[today]) {
      allStats[today] = getEmptyDayStats(today);
    }

    allStats[today].dictation.completed += 1;
    allStats[today].dictation.hintsUsed += data.hintsUsed;
    allStats[today].dictation.pointsEarned += data.pointsEarned;

    await saveDailyStats(allStats);
    console.log('[StatisticsService] Recorded dictation complete:', {
      hintsUsed: data.hintsUsed,
      todayStats: allStats[today].dictation,
    });
  } catch (error) {
    console.error('[StatisticsService] Error recording dictation complete:', error);
  }
};

/**
 * Record dictation study time
 */
export const recordDictationStudyTime = async (seconds: number): Promise<void> => {
  try {
    const allStats = await getAllDailyStats();
    const today = getTodayDateString();

    if (!allStats[today]) {
      allStats[today] = getEmptyDayStats(today);
    }

    allStats[today].dictation.studyTimeSeconds += seconds;
    await saveDailyStats(allStats);
  } catch (error) {
    console.error('[StatisticsService] Error recording dictation study time:', error);
  }
};

/**
 * Record points deducted (e.g., hints used that cost points)
 */
export const recordPointsDeducted = async (points: number): Promise<void> => {
  try {
    const allStats = await getAllDailyStats();
    const today = getTodayDateString();

    if (!allStats[today]) {
      allStats[today] = getEmptyDayStats(today);
    }

    allStats[today].pointsDeducted += points;
    await saveDailyStats(allStats);
    console.log('[StatisticsService] Recorded points deducted:', points);
  } catch (error) {
    console.error('[StatisticsService] Error recording points deducted:', error);
  }
};

// Legacy function for backward compatibility
export const recordSingleDictationSentence = async (data: {
  correct: boolean;
  pointsEarned: number;
}): Promise<void> => {
  if (data.correct) {
    await recordDictationComplete({
      hintsUsed: 0,
      pointsEarned: data.pointsEarned,
    });
  }
};

// Legacy session functions
export const recordShadowingSession = async (data: {
  sentencesCompleted: number;
  correctCount: number;
  totalAttempts: number;
  pointsEarned: number;
  studyTimeSeconds: number;
}): Promise<void> => {
  await recordShadowingStudyTime(data.studyTimeSeconds);
};

export const recordDictationSession = async (data: {
  sentencesCompleted: number;
  correctCount: number;
  errorCount: number;
  totalAttempts: number;
  pointsEarned: number;
  studyTimeSeconds: number;
}): Promise<void> => {
  await recordDictationStudyTime(data.studyTimeSeconds);
};

// ============================================
// AGGREGATION
// ============================================

const aggregateStats = (allStats: Record<string, DailyStats>, startDate: Date, endDate: Date): DailyStats => {
  const result = getEmptyDayStats('aggregated');

  Object.entries(allStats).forEach(([dateStr, dayStats]) => {
    const date = new Date(dateStr);
    if (date >= startDate && date <= endDate) {
      // Shadowing
      result.shadowing.recorded += dayStats.shadowing.recorded;
      result.shadowing.correct += dayStats.shadowing.correct;
      result.shadowing.incorrect += dayStats.shadowing.incorrect;
      result.shadowing.totalSimilarity += dayStats.shadowing.totalSimilarity;
      result.shadowing.pointsEarned += dayStats.shadowing.pointsEarned;
      result.shadowing.studyTimeSeconds += dayStats.shadowing.studyTimeSeconds;

      // Dictation
      result.dictation.completed += dayStats.dictation.completed;
      result.dictation.hintsUsed += dayStats.dictation.hintsUsed;
      result.dictation.pointsEarned += dayStats.dictation.pointsEarned;
      result.dictation.studyTimeSeconds += dayStats.dictation.studyTimeSeconds;

      // Points deducted
      result.pointsDeducted += dayStats.pointsDeducted || 0;
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
 * Get weekly activity for chart (last 7 days)
 */
export const getWeeklyActivity = async (): Promise<WeeklyActivity> => {
  const allStats = await getAllDailyStats();
  const dates: string[] = [];
  const shadowing: number[] = [];
  const dictation: number[] = [];

  // Get last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dates.push(dateStr);

    const dayStats = allStats[dateStr] || getEmptyDayStats(dateStr);
    shadowing.push(dayStats.shadowing.recorded);
    dictation.push(dayStats.dictation.completed);
  }

  return { dates, shadowing, dictation };
};

/**
 * Calculate average similarity for shadowing
 */
export const getAverageSimilarity = (stats: DailyStats): number => {
  if (stats.shadowing.recorded === 0) return 0;
  return Math.round(stats.shadowing.totalSimilarity / stats.shadowing.recorded);
};

/**
 * Calculate accuracy percentage
 */
export const getAccuracy = (correct: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
};

// ============================================
// CLEANUP
// ============================================

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

/**
 * Reset all statistics (for debugging/testing)
 */
export const resetAllStats = async (): Promise<void> => {
  await saveDailyStats({});
  console.log('[StatisticsService] All stats reset');
};

// ============================================
// EXPORTS
// ============================================

export const statisticsService = {
  getTodayStats,
  getStatsSummary,
  getWeeklyActivity,
  recordShadowingAttempt,
  recordShadowingStudyTime,
  recordDictationComplete,
  recordDictationStudyTime,
  recordSingleShadowingSentence,
  recordSingleDictationSentence,
  recordShadowingSession,
  recordDictationSession,
  cleanupOldStats,
  resetAllStats,
  getAllDailyStats,
  getAverageSimilarity,
  getAccuracy,
};

export default statisticsService;
