import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DailyPhrase } from '../../types/phrase.types';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';

interface PhraseCardProps {
  phrase: DailyPhrase;
  _nativeLanguage?: 'vi' | 'en' | 'de';
}

/**
 * PhraseCard Component
 * Displays a daily German phrase with translations and example
 */
const PhraseCard: React.FC<PhraseCardProps> = ({ phrase }) => {
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
    backgroundColor: colors.retroCream,
    borderRadius: borderRadius.medium,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 4,
    borderColor: colors.retroBorder,
    ...shadows.lg,
  },
  headerSection: {
    borderBottomWidth: 3,
    borderBottomColor: colors.retroCyan,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  phraseText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.retroCoral,
    marginBottom: spacing.xs,
  },
  meaningText: {
    fontSize: 16,
    color: colors.retroDark,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  translationsSection: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.small,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.retroPurple,
    width: 35,
    marginRight: spacing.xs,
  },
  translationText: {
    flex: 1,
    fontSize: 16,
    color: colors.retroDark,
    lineHeight: 24,
    fontWeight: '500',
  },
  exampleSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.retroYellow,
    borderRadius: borderRadius.small,
    padding: spacing.md,
    borderWidth: 3,
    borderColor: colors.retroBorder,
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.retroDark,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  exampleText: {
    fontSize: 16,
    color: colors.retroDark,
    fontStyle: 'italic',
    lineHeight: 24,
    fontWeight: '500',
  },
});

export default PhraseCard;
