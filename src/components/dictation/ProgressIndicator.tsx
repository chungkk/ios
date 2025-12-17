import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface ProgressIndicatorProps {
  completedCount: number;
  totalCount: number;
  progress: number; // 0-100 percentage
}

/**
 * ProgressIndicator Component
 * Shows X/Y sentences completed with progress bar
 */
const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  completedCount,
  totalCount,
  progress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.count}>
          {completedCount} / {totalCount} completed
        </Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${Math.min(100, Math.max(0, progress))}%` },
          ]}
        />
      </View>

      <Text style={styles.percentage}>{Math.round(progress)}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.medium,
    padding: spacing.lg,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  count: {
    fontSize: 14,
    color: colors.textMuted,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accentBlue,
    borderRadius: borderRadius.round,
  },
  percentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.accentBlue,
    textAlign: 'center',
  },
});

export default ProgressIndicator;
