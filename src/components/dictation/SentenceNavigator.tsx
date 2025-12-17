import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface SentenceNavigatorProps {
  currentIndex: number;
  totalSentences: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isSubmitted: boolean;
}

/**
 * SentenceNavigator Component
 * Navigation controls for moving between sentences
 */
const SentenceNavigator: React.FC<SentenceNavigatorProps> = ({
  currentIndex,
  totalSentences,
  onPrevious,
  onNext,
  canGoBack,
  canGoNext,
  isSubmitted,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, !canGoBack && styles.buttonDisabled]}
        onPress={onPrevious}
        disabled={!canGoBack}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>← Previous</Text>
      </TouchableOpacity>

      <View style={styles.indicator}>
        <Text style={styles.indicatorText}>
          {currentIndex + 1} / {totalSentences}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (!canGoNext || !isSubmitted) && styles.buttonDisabled,
        ]}
        onPress={onNext}
        disabled={!canGoNext || !isSubmitted}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Next →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.small,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  indicator: {
    paddingHorizontal: spacing.lg,
  },
  indicatorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accentBlue,
  },
});

export default SentenceNavigator;
