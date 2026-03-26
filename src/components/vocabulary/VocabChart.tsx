import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing } from '../../styles/theme';
import { vocabularyService } from '../../services/vocabulary.service';

interface ChartDataItem {
  date: string;
  added: number;
  reviewed: number;
  mastered: number;
}

interface StatsData {
  chartData: ChartDataItem[];
  summary: { totalAdded: number; totalReviewed: number; totalMastered: number };
  statusCounts: { total: number; new: number; learning: number; mastered: number };
}

const VocabChart: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await vocabularyService.fetchVocabStats(period);
        setData(result);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  const chartData = data?.chartData || [];
  const summary = data?.summary || { totalAdded: 0, totalReviewed: 0, totalMastered: 0 };
  const statusCounts = data?.statusCounts || { total: 0, new: 0, learning: 0, mastered: 0 };

  const maxValue = useMemo(() => {
    if (!chartData.length) return 10;
    return Math.max(
      ...chartData.map(d => Math.max(d.added, d.reviewed, d.mastered)),
      1,
    );
  }, [chartData]);

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[d.getDay()];
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  if (loading && !data) {
    return (
      <View style={styles.card}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.retroCyan} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Tiến độ học từ vựng</Text>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodBtn, period === 'week' && styles.periodBtnActive]}
            onPress={() => setPeriod('week')}
          >
            <Text style={[styles.periodBtnText, period === 'week' && styles.periodBtnTextActive]}>
              Tuần
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodBtn, period === 'month' && styles.periodBtnActive]}
            onPress={() => setPeriod('month')}
          >
            <Text style={[styles.periodBtnText, period === 'month' && styles.periodBtnTextActive]}>
              Tháng
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.summaryLabel}>Thêm mới</Text>
          <Text style={styles.summaryValue}>{summary.totalAdded}</Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.summaryLabel}>Đã ôn</Text>
          <Text style={styles.summaryValue}>{summary.totalReviewed}</Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.summaryLabel}>Thuộc</Text>
          <Text style={styles.summaryValue}>{summary.totalMastered}</Text>
        </View>
      </View>

      {/* Simple Bar Chart */}
      {chartData.length > 0 ? (
        <View style={styles.chartArea}>
          <View style={styles.barsContainer}>
            {chartData.map((d) => {
              const addedH = (d.added / maxValue) * 80;
              const reviewedH = (d.reviewed / maxValue) * 80;
              const masteredH = (d.mastered / maxValue) * 80;
              const isToday = d.date === new Date().toISOString().split('T')[0];

              return (
                <View key={d.date} style={[styles.barGroup, isToday && styles.barGroupToday]}>
                  <View style={styles.barsRow}>
                    {d.added > 0 && (
                      <View style={[styles.bar, { height: Math.max(addedH, 4), backgroundColor: '#3b82f6' }]} />
                    )}
                    {d.reviewed > 0 && (
                      <View style={[styles.bar, { height: Math.max(reviewedH, 4), backgroundColor: '#f59e0b' }]} />
                    )}
                    {d.mastered > 0 && (
                      <View style={[styles.bar, { height: Math.max(masteredH, 4), backgroundColor: '#10b981' }]} />
                    )}
                    {d.added === 0 && d.reviewed === 0 && d.mastered === 0 && (
                      <View style={styles.barEmpty} />
                    )}
                  </View>
                  <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                    {period === 'week' ? formatDay(d.date) : formatDate(d.date)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <Text style={styles.noData}>Chưa có dữ liệu</Text>
      )}

      {/* Status Distribution */}
      {statusCounts.total > 0 && (
        <>
          <View style={styles.statusBar}>
            <View
              style={[styles.statusSegment, {
                width: `${(statusCounts.mastered / statusCounts.total) * 100}%`,
                backgroundColor: '#10b981',
              }]}
            />
            <View
              style={[styles.statusSegment, {
                width: `${(statusCounts.learning / statusCounts.total) * 100}%`,
                backgroundColor: '#f59e0b',
              }]}
            />
            <View
              style={[styles.statusSegment, {
                width: `${(statusCounts.new / statusCounts.total) * 100}%`,
                backgroundColor: '#94a3b8',
              }]}
            />
          </View>
          <View style={styles.statusLabels}>
            <Text style={styles.statusLabelText}>✅ {statusCounts.mastered}</Text>
            <Text style={styles.statusLabelText}>📝 {statusCounts.learning}</Text>
            <Text style={styles.statusLabelText}>🆕 {statusCounts.new}</Text>
            <Text style={styles.statusLabelText}>Tổng: {statusCounts.total}</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.retroCream,
    borderRadius: 14,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.retroDark,
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.retroBorder,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  periodBtnActive: {
    backgroundColor: colors.retroCyan,
  },
  periodBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodBtnTextActive: {
    color: '#fff',
  },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.retroDark,
  },
  // Chart
  chartArea: {
    marginBottom: 12,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  barGroupToday: {
    borderRadius: 6,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    flex: 1,
    justifyContent: 'center',
  },
  bar: {
    width: 6,
    borderRadius: 3,
    minHeight: 4,
  },
  barEmpty: {
    width: 6,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
  },
  barLabel: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 4,
  },
  barLabelToday: {
    fontWeight: '700',
    color: colors.retroCyan,
  },
  noData: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Status distribution
  statusBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
    backgroundColor: '#e0e0e0',
  },
  statusSegment: {
    height: '100%',
  },
  statusLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusLabelText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default VocabChart;
