import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing } from '../../styles/theme';
import dailyProgressService, {
  DailyProgress,
  HeatMapDay,
  WeeklyStats,
} from '../../services/dailyProgress.service';
import { VocabularyItem } from '../../services/vocabulary.service';

interface VocabAnalyticsProps {
  visible: boolean;
  onClose: () => void;
  vocabulary: VocabularyItem[];
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const INTENSITY_COLORS = ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'];

const VocabAnalytics: React.FC<VocabAnalyticsProps> = ({ visible, onClose, vocabulary }) => {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [heatMap, setHeatMap] = useState<HeatMapDay[]>([]);
  const [recentHistory, setRecentHistory] = useState<DailyProgress[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [stats, heat, history] = await Promise.all([
        dailyProgressService.getWeeklyStats(),
        dailyProgressService.getHeatMap(28), // 4 weeks
        dailyProgressService.getRecentHistory(7),
      ]);
      setWeeklyStats(stats);
      setHeatMap(heat);
      setRecentHistory(history);
    } catch (e) {
      console.error('[Analytics] Error:', e);
    }
  }, []);

  useEffect(() => {
    if (visible) loadData();
  }, [visible, loadData]);

  // Weakest words: most lapses or lowest accuracy
  const weakestWords = useMemo(() => {
    return vocabulary
      .filter(v => (v.srsLapses ?? 0) > 0 || v.status === 'learning')
      .sort((a, b) => (b.srsLapses ?? 0) - (a.srsLapses ?? 0))
      .slice(0, 5);
  }, [vocabulary]);

  // Word distribution by lesson
  const wordsByLesson = useMemo(() => {
    const groups: Record<string, number> = {};
    vocabulary.forEach(v => {
      const key = v.lessonTitle || 'Không có bài học';
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.entries(groups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [vocabulary]);

  // Last 7 days bar chart data
  const barChartData = useMemo(() => {
    return recentHistory.slice(0, 7).reverse().map(d => {
      const day = new Date(d.date);
      return {
        label: WEEKDAYS[day.getDay()],
        value: d.wordsReviewed,
        goal: d.dailyGoal,
        accuracy: d.wordsReviewed > 0 ? Math.round((d.wordsCorrect / d.wordsReviewed) * 100) : 0,
      };
    });
  }, [recentHistory]);

  const maxBarValue = useMemo(() => {
    return Math.max(...barChartData.map(d => Math.max(d.value, d.goal)), 1);
  }, [barChartData]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="close" size={24} color={colors.retroDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📊 Thống kê học tập</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {/* Weekly Stats Cards */}
          {weeklyStats && (
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
                <Text style={styles.statCardValue}>{weeklyStats.avgWordsPerDay}</Text>
                <Text style={styles.statCardLabel}>Từ/ngày</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.statCardValue}>{weeklyStats.avgAccuracy}%</Text>
                <Text style={styles.statCardLabel}>Chính xác</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
                <Text style={styles.statCardValue}>{weeklyStats.daysStudied}/7</Text>
                <Text style={styles.statCardLabel}>Ngày học</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
                <Text style={styles.statCardValue}>{weeklyStats.totalTimeMinutes}m</Text>
                <Text style={styles.statCardLabel}>Tổng thời gian</Text>
              </View>
            </View>
          )}

          {/* Goal Completion Rate */}
          {weeklyStats && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎯 Tỷ lệ hoàn thành mục tiêu</Text>
              <View style={styles.goalBar}>
                <View style={[styles.goalFill, { width: `${weeklyStats.goalCompletionRate}%` }]} />
              </View>
              <Text style={styles.goalText}>{weeklyStats.goalCompletionRate}% trong 7 ngày qua</Text>
            </View>
          )}

          {/* Bar Chart — Last 7 days */}
          {barChartData.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📈 7 ngày gần đây</Text>
              <View style={styles.barChart}>
                {barChartData.map((d, i) => (
                  <View key={i} style={styles.barCol}>
                    <Text style={styles.barValue}>{d.value}</Text>
                    <View style={styles.barTrack}>
                      {/* Goal line */}
                      <View style={[styles.barGoalLine, { bottom: `${(d.goal / maxBarValue) * 100}%` }]} />
                      {/* Bar */}
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${(d.value / maxBarValue) * 100}%`,
                            backgroundColor: d.value >= d.goal ? '#4CAF50' : colors.retroCyan,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{d.label}</Text>
                    <Text style={[styles.barAccuracy, { color: d.accuracy >= 80 ? '#4CAF50' : '#FF9800' }]}>
                      {d.accuracy > 0 ? `${d.accuracy}%` : '—'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Heat Map */}
          {heatMap.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🗓 Lịch học tập (28 ngày)</Text>
              <View style={styles.heatMap}>
                {heatMap.slice().reverse().map((d, i) => (
                  <View
                    key={i}
                    style={[
                      styles.heatCell,
                      { backgroundColor: INTENSITY_COLORS[d.intensity] },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.heatLegend}>
                <Text style={styles.heatLegendText}>Ít</Text>
                {INTENSITY_COLORS.map((c, i) => (
                  <View key={i} style={[styles.heatLegendCell, { backgroundColor: c }]} />
                ))}
                <Text style={styles.heatLegendText}>Nhiều</Text>
              </View>
            </View>
          )}

          {/* Weakest Words */}
          {weakestWords.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚠️ Từ yếu nhất</Text>
              {weakestWords.map((w, i) => (
                <View key={w.id} style={styles.weakWordRow}>
                  <Text style={styles.weakWordRank}>{i + 1}</Text>
                  <View style={styles.weakWordInfo}>
                    <Text style={styles.weakWordText}>{w.word}</Text>
                    <Text style={styles.weakWordTrans}>{w.translation}</Text>
                  </View>
                  <View style={styles.weakWordBadge}>
                    <Text style={styles.weakWordBadgeText}>⟳ {w.srsLapses ?? 0}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Words by Lesson */}
          {wordsByLesson.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📚 Phân bố theo bài học</Text>
              {wordsByLesson.map(([lesson, count], i) => (
                <View key={i} style={styles.lessonRow}>
                  <Text style={styles.lessonTitle} numberOfLines={1}>{lesson}</Text>
                  <View style={styles.lessonBarBg}>
                    <View
                      style={[
                        styles.lessonBarFill,
                        { width: `${(count / (wordsByLesson[0]?.[1] || 1)) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.lessonCount}>{count}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.retroCream,
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.retroDark,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.retroDark,
  },
  statCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.retroDark,
    marginBottom: 12,
  },
  goalBar: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  goalText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barValue: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.retroDark,
    marginBottom: 2,
  },
  barTrack: {
    width: 20,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barGoalLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#FF5722',
    zIndex: 1,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  barAccuracy: {
    fontSize: 9,
    fontWeight: '700',
  },
  heatMap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  heatCell: {
    width: 18,
    height: 18,
    borderRadius: 3,
  },
  heatLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 8,
  },
  heatLegendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  heatLegendText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  weakWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  weakWordRank: {
    width: 24,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
  },
  weakWordInfo: {
    flex: 1,
  },
  weakWordText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.retroDark,
  },
  weakWordTrans: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  weakWordBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  weakWordBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D32F2F',
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  lessonTitle: {
    width: 90,
    fontSize: 11,
    color: colors.textSecondary,
  },
  lessonBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  lessonBarFill: {
    height: '100%',
    backgroundColor: colors.retroPurple,
    borderRadius: 4,
  },
  lessonCount: {
    width: 30,
    fontSize: 12,
    fontWeight: '700',
    color: colors.retroDark,
    textAlign: 'right',
  },
});

export default VocabAnalytics;
