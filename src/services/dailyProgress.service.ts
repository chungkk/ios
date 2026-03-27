// Daily Progress & Streak tracking service
// Persists to AsyncStorage for offline-first experience

import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_KEY_PREFIX = '@daily_progress_';
const STREAK_KEY = '@vocab_streak';
const SETTINGS_KEY = '@vocab_daily_settings';

export interface DailyProgress {
  date: string;            // YYYY-MM-DD
  wordsReviewed: number;
  wordsCorrect: number;
  dailyGoal: number;
  sessionsCompleted: number;
  timeSpentSeconds: number;
  wordsAdded: number;      // new words added today
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;   // YYYY-MM-DD
  freezesUsed: number;     // how many freeze days used this month
  freezeResetMonth: string; // YYYY-MM to track monthly reset
}

export interface DailySettings {
  dailyGoal: number;       // default: 15
  newWordsPerDay: number;  // default: 10 (options: 5, 10, 20)
}

const DEFAULT_DAILY_GOAL = 15;
const DEFAULT_NEW_WORDS_PER_DAY = 10;
const MAX_FREEZES_PER_MONTH = 2;
const PROGRESS_RETENTION_DAYS = 30;

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getProgressKey(date: string): string {
  return `${PROGRESS_KEY_PREFIX}${date}`;
}

/**
 * Get today's progress
 */
async function getTodayProgress(): Promise<DailyProgress> {
  const today = getTodayKey();
  try {
    const json = await AsyncStorage.getItem(getProgressKey(today));
    if (json) return JSON.parse(json);
  } catch (e) {
    console.error('[DailyProgress] Error reading progress:', e);
  }
  const settings = await getSettings();
  return {
    date: today,
    wordsReviewed: 0,
    wordsCorrect: 0,
    dailyGoal: settings.dailyGoal,
    sessionsCompleted: 0,
    timeSpentSeconds: 0,
    wordsAdded: 0,
  };
}

/**
 * Update today's progress after a study session
 */
async function recordSession(wordsReviewed: number, wordsCorrect: number, timeSpentSeconds: number): Promise<DailyProgress> {
  const progress = await getTodayProgress();
  progress.wordsReviewed += wordsReviewed;
  progress.wordsCorrect += wordsCorrect;
  progress.sessionsCompleted += 1;
  progress.timeSpentSeconds += timeSpentSeconds;

  try {
    await AsyncStorage.setItem(getProgressKey(progress.date), JSON.stringify(progress));
  } catch (e) {
    console.error('[DailyProgress] Error saving progress:', e);
  }

  // Update streak
  await updateStreak();

  return progress;
}

/**
 * Get streak data, recalculating based on current date
 */
async function getStreak(): Promise<StreakData> {
  const currentMonth = getTodayKey().slice(0, 7); // YYYY-MM
  try {
    const json = await AsyncStorage.getItem(STREAK_KEY);
    if (json) {
      const data: StreakData = JSON.parse(json);
      // Reset monthly freeze counter if new month
      if (data.freezeResetMonth !== currentMonth) {
        data.freezesUsed = 0;
        data.freezeResetMonth = currentMonth;
      }
      // Validate streak is still valid
      const today = getTodayKey();
      const yesterday = getDateOffset(-1);
      const twoDaysAgo = getDateOffset(-2);

      if (data.lastStudyDate === today) {
        return data;
      } else if (data.lastStudyDate === yesterday) {
        // Studied yesterday, streak continues
        return data;
      } else if (data.lastStudyDate === twoDaysAgo && data.freezesUsed < MAX_FREEZES_PER_MONTH) {
        // 2-day gap but freeze available — auto-use freeze
        data.freezesUsed += 1;
        await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
        return data;
      } else {
        // Streak broken — reset current but keep longest
        const reset: StreakData = {
          currentStreak: 0,
          longestStreak: data.longestStreak,
          lastStudyDate: data.lastStudyDate,
          freezesUsed: data.freezesUsed,
          freezeResetMonth: currentMonth,
        };
        await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(reset));
        return reset;
      }
    }
  } catch (e) {
    console.error('[DailyProgress] Error reading streak:', e);
  }
  return { currentStreak: 0, longestStreak: 0, lastStudyDate: '', freezesUsed: 0, freezeResetMonth: currentMonth };
}

/**
 * Update streak after a study session
 */
async function updateStreak(): Promise<StreakData> {
  const streak = await getStreak();
  const today = getTodayKey();

  if (streak.lastStudyDate === today) {
    return streak;
  }

  const yesterday = getDateOffset(-1);
  const twoDaysAgo = getDateOffset(-2);

  if (streak.lastStudyDate === yesterday || streak.currentStreak === 0) {
    streak.currentStreak += 1;
  } else if (streak.lastStudyDate === twoDaysAgo) {
    // Was saved by freeze, continue streak
    streak.currentStreak += 1;
  } else {
    streak.currentStreak = 1;
  }

  streak.lastStudyDate = today;
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);

  try {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  } catch (e) {
    console.error('[DailyProgress] Error saving streak:', e);
  }

  return streak;
}

/**
 * Get daily settings
 */
async function getSettings(): Promise<DailySettings> {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    if (json) return JSON.parse(json);
  } catch (e) {
    console.error('[DailyProgress] Error reading settings:', e);
  }
  return { dailyGoal: DEFAULT_DAILY_GOAL, newWordsPerDay: DEFAULT_NEW_WORDS_PER_DAY };
}

/**
 * Update daily goal
 */
async function setDailyGoal(goal: number): Promise<void> {
  const settings = await getSettings();
  settings.dailyGoal = Math.max(1, Math.min(100, goal));
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('[DailyProgress] Error saving settings:', e);
  }
}

/**
 * Update new words per day limit
 */
async function setNewWordsPerDay(limit: number): Promise<void> {
  const settings = await getSettings();
  settings.newWordsPerDay = limit;
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('[DailyProgress] Error saving settings:', e);
  }
}

/**
 * Record a new word added today
 */
async function recordWordAdded(): Promise<{ wordsAdded: number; limit: number }> {
  const progress = await getTodayProgress();
  const settings = await getSettings();
  progress.wordsAdded = (progress.wordsAdded || 0) + 1;
  try {
    await AsyncStorage.setItem(getProgressKey(progress.date), JSON.stringify(progress));
  } catch (e) {
    console.error('[DailyProgress] Error recording word added:', e);
  }
  return { wordsAdded: progress.wordsAdded, limit: settings.newWordsPerDay };
}

/**
 * Check if user can still add new words today
 */
async function canAddNewWord(): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const progress = await getTodayProgress();
  const settings = await getSettings();
  const added = progress.wordsAdded || 0;
  const limit = settings.newWordsPerDay;
  return { allowed: added < limit, remaining: Math.max(0, limit - added), limit };
}

/**
 * Helper: get date string offset from today
 */
function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Check if daily goal is completed today
 */
async function isGoalCompleted(): Promise<boolean> {
  const progress = await getTodayProgress();
  return progress.wordsReviewed >= progress.dailyGoal;
}

/**
 * Get remaining streak freezes this month
 */
async function getFreezesRemaining(): Promise<number> {
  const streak = await getStreak();
  return MAX_FREEZES_PER_MONTH - streak.freezesUsed;
}

/**
 * Cleanup old daily progress entries (keep only last PROGRESS_RETENTION_DAYS days)
 * Call periodically (e.g. on app start) to prevent unbounded key growth
 */
async function cleanupOldProgress(): Promise<number> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const progressKeys = allKeys.filter(k => k.startsWith(PROGRESS_KEY_PREFIX));
    const cutoff = getDateOffset(-PROGRESS_RETENTION_DAYS);
    const keysToDelete = progressKeys.filter(k => {
      const dateStr = k.replace(PROGRESS_KEY_PREFIX, '');
      return dateStr < cutoff;
    });
    if (keysToDelete.length > 0) {
      await AsyncStorage.multiRemove(keysToDelete);
    }
    return keysToDelete.length;
  } catch (e) {
    console.error('[DailyProgress] Error cleaning up:', e);
    return 0;
  }
}

/**
 * Get recent N days of progress history for analytics
 */
async function getRecentHistory(days: number = 30): Promise<DailyProgress[]> {
  const results: DailyProgress[] = [];
  const settings = await getSettings();
  for (let i = 0; i < days; i++) {
    const dateStr = getDateOffset(-i);
    try {
      const json = await AsyncStorage.getItem(getProgressKey(dateStr));
      if (json) {
        results.push(JSON.parse(json));
      } else {
        results.push({
          date: dateStr,
          wordsReviewed: 0,
          wordsCorrect: 0,
          dailyGoal: settings.dailyGoal,
          sessionsCompleted: 0,
          timeSpentSeconds: 0,
          wordsAdded: 0,
        });
      }
    } catch {
      results.push({
        date: dateStr,
        wordsReviewed: 0,
        wordsCorrect: 0,
        dailyGoal: settings.dailyGoal,
        sessionsCompleted: 0,
        timeSpentSeconds: 0,
        wordsAdded: 0,
      });
    }
  }
  return results; // index 0 = today, index N = N days ago
}

export interface HeatMapDay {
  date: string;
  intensity: 0 | 1 | 2 | 3 | 4; // 0=no study, 1=light, 2=moderate, 3=good, 4=excellent
  wordsReviewed: number;
}

/**
 * Get heatmap data for last N days
 */
async function getHeatMap(days: number = 30): Promise<HeatMapDay[]> {
  const history = await getRecentHistory(days);
  return history.map(d => {
    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    if (d.wordsReviewed >= d.dailyGoal) intensity = 4;
    else if (d.wordsReviewed >= d.dailyGoal * 0.7) intensity = 3;
    else if (d.wordsReviewed >= d.dailyGoal * 0.3) intensity = 2;
    else if (d.wordsReviewed > 0) intensity = 1;
    return { date: d.date, intensity, wordsReviewed: d.wordsReviewed };
  });
}

export interface WeeklyStats {
  avgWordsPerDay: number;
  avgAccuracy: number;
  totalSessions: number;
  totalTimeMinutes: number;
  daysStudied: number;
  goalCompletionRate: number; // % of days goal was hit
}

/**
 * Get aggregated stats for the last 7 days
 */
async function getWeeklyStats(): Promise<WeeklyStats> {
  const history = await getRecentHistory(7);
  const daysStudied = history.filter(d => d.wordsReviewed > 0).length;
  const totalReviewed = history.reduce((s, d) => s + d.wordsReviewed, 0);
  const totalCorrect = history.reduce((s, d) => s + d.wordsCorrect, 0);
  const totalSessions = history.reduce((s, d) => s + d.sessionsCompleted, 0);
  const totalTime = history.reduce((s, d) => s + d.timeSpentSeconds, 0);
  const goalsHit = history.filter(d => d.wordsReviewed >= d.dailyGoal).length;

  return {
    avgWordsPerDay: daysStudied > 0 ? Math.round(totalReviewed / 7) : 0,
    avgAccuracy: totalReviewed > 0 ? Math.round((totalCorrect / totalReviewed) * 100) : 0,
    totalSessions,
    totalTimeMinutes: Math.round(totalTime / 60),
    daysStudied,
    goalCompletionRate: Math.round((goalsHit / 7) * 100),
  };
}

/**
 * Push local progress + streak to server for cross-device sync
 * Gracefully fails if server unavailable (offline-first)
 */
async function syncToCloud(): Promise<boolean> {
  try {
    const api = (await import('./api')).default;
    const [streak, history, settings] = await Promise.all([
      getStreak(),
      getRecentHistory(30),
      getSettings(),
    ]);
    await api.post('/api/vocab-progress/sync', {
      streak,
      history: history.filter(d => d.wordsReviewed > 0), // only days with activity
      settings,
    });
    return true;
  } catch (e) {
    console.warn('[DailyProgress] Cloud sync push failed (offline?):', e);
    return false;
  }
}

/**
 * Pull progress from server (for device migration / restore)
 * Merges with local data, keeping the higher values
 */
async function syncFromCloud(): Promise<boolean> {
  try {
    const api = (await import('./api')).default;
    const response = await api.get<{
      streak?: StreakData;
      history?: DailyProgress[];
      settings?: DailySettings;
    }>('/api/vocab-progress/sync');
    const data = response.data;

    // Merge streak: keep higher values
    if (data.streak) {
      const local = await getStreak();
      const merged: StreakData = {
        currentStreak: Math.max(local.currentStreak, data.streak.currentStreak),
        longestStreak: Math.max(local.longestStreak, data.streak.longestStreak),
        lastStudyDate: local.lastStudyDate > data.streak.lastStudyDate ? local.lastStudyDate : data.streak.lastStudyDate,
        freezesUsed: local.freezesUsed,
        freezeResetMonth: local.freezeResetMonth,
      };
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(merged));
    }

    // Merge history: keep higher wordsReviewed per day
    if (data.history) {
      for (const remote of data.history) {
        const key = getProgressKey(remote.date);
        const localJson = await AsyncStorage.getItem(key);
        if (localJson) {
          const local: DailyProgress = JSON.parse(localJson);
          if (remote.wordsReviewed > local.wordsReviewed) {
            await AsyncStorage.setItem(key, JSON.stringify(remote));
          }
        } else {
          await AsyncStorage.setItem(key, JSON.stringify(remote));
        }
      }
    }

    // Merge settings
    if (data.settings) {
      const local = await getSettings();
      if (data.settings.dailyGoal !== local.dailyGoal) {
        await setDailyGoal(Math.max(data.settings.dailyGoal, local.dailyGoal));
      }
    }

    return true;
  } catch (e) {
    console.warn('[DailyProgress] Cloud sync pull failed (offline?):', e);
    return false;
  }
}

export const dailyProgressService = {
  getTodayProgress,
  recordSession,
  getStreak,
  updateStreak,
  getSettings,
  setDailyGoal,
  setNewWordsPerDay,
  isGoalCompleted,
  getFreezesRemaining,
  cleanupOldProgress,
  getRecentHistory,
  getHeatMap,
  getWeeklyStats,
  syncToCloud,
  syncFromCloud,
  recordWordAdded,
  canAddNewWord,
};

export default dailyProgressService;
