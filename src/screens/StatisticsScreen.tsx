// StatisticsScreen - User learning statistics dashboard
// Neo-Retro Design

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../styles/theme';
import { getStatsSummary, StatsSummary, DailyStats } from '../services/statistics.service';

type TimePeriod = 'today' | 'week' | 'month';

const StatisticsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [_loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const summary = await getStatsSummary();
      setStats(summary);
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

  const getAccuracy = (correct: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  const totalPoints = currentStats
    ? currentStats.shadowing.pointsEarned + currentStats.dictation.pointsEarned
    : 0;

  const totalStudyTime = currentStats
    ? currentStats.shadowing.studyTimeSeconds + currentStats.dictation.studyTimeSeconds
    : 0;

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

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.retroYellow }]}>
            <Icon name="diamond" size={28} color={colors.retroDark} />
            <Text style={styles.summaryValue}>{totalPoints}</Text>
            <Text style={styles.summaryLabel}>{t('statistics.diamondsEarned')}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.retroCyan }]}>
            <Icon name="time" size={28} color={colors.retroDark} />
            <Text style={styles.summaryValue}>{formatTime(totalStudyTime)}</Text>
            <Text style={styles.summaryLabel}>{t('statistics.studyTime')}</Text>
          </View>
        </View>

        {/* Shadowing Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="mic" size={22} color={colors.retroPurple} />
            <Text style={styles.sectionTitle}>{t('statistics.shadowing')}</Text>
          </View>
          <View style={styles.cardTopBar} />
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentStats?.shadowing.sentencesCompleted || 0}</Text>
              <Text style={styles.statLabel}>{t('statistics.sentencesCompleted')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {currentStats?.shadowing.correctCount || 0}/{currentStats?.shadowing.totalAttempts || 0}
              </Text>
              <Text style={styles.statLabel}>{t('statistics.correctTotal')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {getAccuracy(currentStats?.shadowing.correctCount || 0, currentStats?.shadowing.totalAttempts || 0)}%
              </Text>
              <Text style={styles.statLabel}>{t('statistics.accuracy')}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.diamondBadge}>
                <Icon name="diamond" size={14} color={colors.retroYellow} />
                <Text style={styles.diamondValue}>{currentStats?.shadowing.pointsEarned || 0}</Text>
              </View>
              <Text style={styles.statLabel}>{t('statistics.diamonds')}</Text>
            </View>
          </View>
        </View>

        {/* Dictation Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="create" size={22} color={colors.retroCoral} />
            <Text style={styles.sectionTitle}>{t('statistics.dictation')}</Text>
          </View>
          <View style={[styles.cardTopBar, { backgroundColor: colors.retroCoral }]} />
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentStats?.dictation.sentencesCompleted || 0}</Text>
              <Text style={styles.statLabel}>{t('statistics.sentencesCompleted')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {currentStats?.dictation.correctCount || 0}/{currentStats?.dictation.totalAttempts || 0}
              </Text>
              <Text style={styles.statLabel}>{t('statistics.correctTotal')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.retroCoral }]}>
                {currentStats?.dictation.errorCount || 0}
              </Text>
              <Text style={styles.statLabel}>{t('statistics.errors')}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.diamondBadge}>
                <Icon name="diamond" size={14} color={colors.retroYellow} />
                <Text style={styles.diamondValue}>{currentStats?.dictation.pointsEarned || 0}</Text>
              </View>
              <Text style={styles.statLabel}>{t('statistics.diamonds')}</Text>
            </View>
          </View>
        </View>

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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: spacing.md,
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
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.retroDark,
    marginTop: spacing.sm,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.retroDark,
    opacity: 0.7,
    marginTop: 4,
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
    padding: spacing.md,
    backgroundColor: colors.retroCream,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.retroDark,
  },
  cardTopBar: {
    height: 4,
    backgroundColor: colors.retroPurple,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.retroDark,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  diamondBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.retroDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  diamondValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
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
