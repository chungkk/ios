import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SentenceCheckResult } from '../../services/dictation.service';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { getFeedbackMessage, formatSimilarity } from '../../utils/dictationUtils';

interface DictationFeedbackProps {
  result: SentenceCheckResult;
  expectedSentence: string;
}

/**
 * DictationFeedback Component
 * Displays color-coded word highlighting and similarity score
 */
const DictationFeedback: React.FC<DictationFeedbackProps> = ({ result, expectedSentence }) => {
  const feedbackMessage = getFeedbackMessage(result.similarity);
  const similarityText = formatSimilarity(result.similarity);

  return (
    <ScrollView style={styles.container}>
      {/* Similarity Score */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>Accuracy:</Text>
        <Text style={[
          styles.scoreValue,
          result.similarity >= 85 ? styles.scoreGood : styles.scoreFair
        ]}>
          {similarityText}
        </Text>
      </View>

      {/* Feedback Message */}
      <Text style={styles.feedbackMessage}>{feedbackMessage}</Text>

      {/* Your Answer */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Answer:</Text>
        <View style={styles.wordContainer}>
          {result.userWords.map((word, index) => {
            const isCorrect = result.correctWords.includes(word);
            return (
              <View
                key={`user-${index}`}
                style={[
                  styles.wordBadge,
                  isCorrect ? styles.wordCorrect : styles.wordIncorrect,
                ]}
              >
                <Text style={styles.wordText}>
                  {isCorrect ? '✓ ' : '✗ '}{word}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Expected Answer */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expected Answer:</Text>
        <View style={styles.wordContainer}>
          {result.expectedWords.map((word, index) => (
            <View key={`expected-${index}`} style={styles.wordBadgeExpected}>
              <Text style={styles.wordTextExpected}>{word}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{result.correctWords.length}</Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{result.incorrectWords.length}</Text>
          <Text style={styles.statLabel}>Incorrect</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{result.expectedWords.length}</Text>
          <Text style={styles.statLabel}>Total Words</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.medium,
    padding: spacing.lg,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  scoreLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreGood: {
    color: colors.success,
  },
  scoreFair: {
    color: colors.warning,
  },
  feedbackMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  wordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  wordBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.small,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  wordCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)', // success with opacity
    borderWidth: 1,
    borderColor: colors.success,
  },
  wordIncorrect: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)', // error with opacity
    borderWidth: 1,
    borderColor: colors.error,
  },
  wordBadgeExpected: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.small,
    backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue with opacity
    borderWidth: 1,
    borderColor: colors.accentBlue,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  wordText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  wordTextExpected: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderColor,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.accentBlue,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

export default DictationFeedback;
