import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DailyPhrase } from '../../types/phrase.types';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';

interface PhraseCardProps {
  phrase: DailyPhrase;
  nativeLanguage?: 'vi' | 'en' | 'de';
}

/**
 * PhraseCard Component
 * Displays a daily German phrase with translations and example
 */
const PhraseCard: React.FC<PhraseCardProps> = ({ phrase, nativeLanguage = 'vi' }) => {
  return (
    <View style={styles.card}>
      {/* German Phrase (Header) */}
      <View style={styles.headerSection}>
        <Text style={styles.phraseText}>{phrase.phrase}</Text>
        <Text style={styles.meaningText}>{phrase.meaning}</Text>
      </View>

      {/* Translations */}
      <View style={styles.translationsSection}>
        <View style={styles.translationRow}>
          <Text style={styles.languageLabel}>EN:</Text>
          <Text style={styles.translationText}>{phrase.en}</Text>
        </View>
        <View style={styles.translationRow}>
          <Text style={styles.languageLabel}>VI:</Text>
          <Text style={styles.translationText}>{phrase.vi}</Text>
        </View>
      </View>

      {/* Example Sentence */}
      <View style={styles.exampleSection}>
        <Text style={styles.exampleLabel}>Example:</Text>
        <Text style={styles.exampleText}>{phrase.example}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.medium,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.md,
  },
  headerSection: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  phraseText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.accentBlue,
    marginBottom: spacing.xs,
  },
  meaningText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  translationsSection: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accentCyan,
    width: 35,
    marginRight: spacing.xs,
  },
  translationText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  exampleSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderColor,
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  exampleText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 24,
  },
});

export default PhraseCard;
