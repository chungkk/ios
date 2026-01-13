// StatisticsScreen - User learning statistics dashboard
// Neo-Retro Design - Redesigned with better UX

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../styles/theme';
import {
  getStatsSummary,
  getWeeklyActivity,
  StatsSummary,
  DailyStats,
  WeeklyActivity,
  getAverageSimilarity,
  getAccuracy,
} from '../services/statistics.service';

type TimePeriod = 'today' | 'week' | 'month';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StatisticsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const [summary, activity] = await Promise.all([
        getStatsSummary(),
        getWeeklyActivity(),
      ]);
      setStats(summary);
      setWeeklyActivity(activity);
    } catch (error) {
      console.error('[StatisticsScreen] Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  const getCurrentStats = (): DailyStats | null => {
    if (!stats) return null;
    switch (selectedPeriod) {
      case 'today':
        return stats.today;
      case 'week':
        return stats.thisWeek;
      case 'month':
        return stats.thisMonth;
      default:
        return stats.today;
    }
  };

  const currentStats = getCurrentStats();

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDayName = (dateStr: string): string => {
    const date = new Date(dateStr);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  };

  const totalPoints = currentStats
    ? currentStats.shadowing.pointsEarned + currentStats.dictation.pointsEarned
    : 0;

  const totalStudyTime = currentStats
    ? currentStats.shadowing.studyTimeSeconds + currentStats.dictation.studyTimeSeconds
    : 0;

  const shadowingAccuracy = currentStats
    ? getAccuracy(currentStats.shadowing.correct, currentStats.shadowing.recorded)
    : 0;

  const avgSimilarity = currentStats ? getAverageSimilarity(currentStats) : 0;

  // Get max value for chart scaling
  const maxChartValue = weeklyActivity
    ? Math.max(...weeklyActivity.shadowing, ...weeklyActivity.dictation, 1)
    : 1;

  const renderProgressRing = (progress: number, color: string, size: number = 60) => {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressValue = Math.min(100, Math.max(0, progress));
    const strokeDashoffset = circumference - (progressValue / 100) * circumference;

    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={[styles.progressRingBg, { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth }]} />
        <View
          style={[
            styles.progressRingFill,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              transform: [{ rotate: '-90deg' }],
              position: 'absolute',
            },
          ]}
        />
        <Text style={[styles.progressRingText, { color }]}>{progressValue}%</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.retroCyan} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.retroDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📊 {t('statistics.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'today' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('today')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'today' && styles.periodTextActive]}>
              {t('statistics.today')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
              {t('statistics.thisWeek')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
              {t('statistics.thisMonth')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Hero Cards */}
        <View style={styles.heroRow}>
          <View style={[styles.heroCard, { backgroundColor: colors.retroYellow }]}>
            <Icon name="diamond" size={24} color={colors.retroDark} />
            <Text style={styles.heroValue}>{totalPoints}</Text>
            <Text style={styles.heroLabel}>{t('statistics.diamondsEarned')}</Text>
          </View>
          <View style={[styles.heroCard, { backgroundColor: colors.retroCyan }]}>
            <Icon name="time" size={24} color={colors.retroDark} />
            <Text style={styles.heroValue}>{formatTime(totalStudyTime)}</Text>
            <Text style={styles.heroLabel}>{t('statistics.studyTime')}</Text>
          </View>
        </View>

        {/* Shadowing Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="mic" size={20} color={colors.retroPurple} />
              <Text style={styles.sectionTitle}>{t('statistics.shadowing')}</Text>
            </View>
          </View>
          <View style={[styles.sectionTopBar, { backgroundColor: colors.retroPurple }]} />
          <View style={styles.sectionContent}>
            <View style={styles.statRow}>
              {/* Left: Stats */}
              <View style={styles.statColumn}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t('statistics.recorded')}</Text>
                  <Text style={styles.statValue}>{currentStats?.shadowing.recorded || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t('statistics.correct')}</Text>
                  <Text style={[styles.statValue, { color: colors.retroPurple }]}>
                    {currentStats?.shadowing.correct || 0}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t('statistics.incorrect')}</Text>
                  <Text style={[styles.statValue, { color: colors.retroCoral }]}>
                    {currentStats?.shadowing.incorrect || 0}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t('statistics.avgSimilarity')}</Text>
                  <Text style={styles.statValue}>{avgSimilarity}%</Text>
                </View>
              </View>
              {/* Right: Progress Ring */}
              <View style={styles.progressContainer}>
                <View style={styles.progressCircle}>
                  <Text style={styles.progressPercent}>{shadowingAccuracy}%</Text>
                  <Text style={styles.progressLabel}>{t('statistics.accuracy')}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Dictation Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="create" size={20} color={colors.retroCoral} />
              <Text style={styles.sectionTitle}>{t('statistics.dictation')}</Text>
            </View>
          </View>
          <View style={[styles.sectionTopBar, { backgroundColor: colors.retroCoral }]} />
          <View style={styles.sectionContent}>
            <View style={styles.statRow}>
              {/* Left: Stats */}
              <View style={styles.statColumn}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t('statistics.completed')}</Text>
                  <Text style={styles.statValue}>{currentStats?.dictation.completed || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t('statistics.hintsUsed')}</Text>
                  <Text style={[styles.statValue, { color: colors.retroCoral }]}>
                    {currentStats?.dictation.hintsUsed || 0}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <View style={styles.diamondBadge}>
                    <Icon name="diamond" size={14} color={colors.retroYellow} />
                    <Text style={styles.diamondValue}>{currentStats?.dictation.pointsEarned || 0}</Text>
                  </View>
                  <Text style={styles.statLabel}>{t('statistics.diamonds')}</Text>
                </View>
              </View>
              {/* Right: Icon */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressCircle, { backgroundColor: colors.retroCoral + '20' }]}>
                  <Icon name="checkmark-circle" size={32} color={colors.retroCoral} />
                  <Text style={styles.progressLabel}>{currentStats?.dictation.completed || 0} câu</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Weekly Activity Chart */}
        {weeklyActivity && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Icon name="bar-chart" size={20} color={colors.retroCyan} />
                <Text style={styles.sectionTitle}>{t('statistics.weeklyActivity')}</Text>
              </View>
            </View>
            <View style={[styles.sectionTopBar, { backgroundColor: colors.retroCyan }]} />
            <View style={styles.chartContainer}>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.retroPurple }]} />
                  <Text style={styles.legendText}>Shadowing</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.retroCoral }]} />
                  <Text style={styles.legendText}>Dictation</Text>
                </View>
              </View>
              <View style={styles.chartBars}>
                {weeklyActivity.dates.map((date, index) => (
                  <View key={date} style={styles.chartColumn}>
                    <View style={styles.barContainer}>
                      {/* Shadowing bar */}
                      <View
                        style={[
                          styles.bar,
                          styles.barShadowing,
                          { height: Math.max(4, (weeklyActivity.shadowing[index] / maxChartValue) * 80) },
                        ]}
                      />
                      {/* Dictation bar */}
                      <View
                        style={[
                          styles.bar,
                          styles.barDictation,
                          { height: Math.max(4, (weeklyActivity.dictation[index] / maxChartValue) * 80) },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartLabel}>{formatDayName(date)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Icon name="bulb" size={20} color={colors.retroYellow} />
          <Text style={styles.tipsText}>{t('statistics.tip')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.retroCream,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.retroDark,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: colors.retroCyan,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  periodTextActive: {
    color: colors.retroDark,
    fontWeight: '700',
  },
  heroRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  heroCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.retroDark,
    marginTop: spacing.sm,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.retroDark,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.retroCream,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.retroDark,
  },
  sectionTopBar: {
    height: 4,
  },
  sectionContent: {
    padding: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statColumn: {
    flex: 1,
  },
  statItem: {
    marginBottom: spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.retroDark,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  progressCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.retroPurple + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.retroBorder,
  },
  progressPercent: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.retroDark,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressRingBg: {
    borderColor: colors.bgSecondary,
    position: 'absolute',
  },
  progressRingFill: {
  },
  progressRingText: {
    fontSize: 14,
    fontWeight: '800',
  },
  diamondBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.retroDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    alignSelf: 'flex-start',
  },
  diamondValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  chartContainer: {
    padding: spacing.md,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 20,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: 2,
  },
  bar: {
    width: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.retroBorder,
  },
  barShadowing: {
    backgroundColor: colors.retroPurple,
  },
  barDictation: {
    backgroundColor: colors.retroCoral,
  },
  chartLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    fontWeight: '600',
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    gap: spacing.sm,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
  },
});

export default StatisticsScreen;
