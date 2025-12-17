// SentenceItem component - Single transcript sentence with highlighting

import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Sentence } from '../../types/lesson.types';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { textStyles } from '../../styles/typography';

interface SentenceItemProps {
  sentence: Sentence;
  isActive: boolean;
  onPress?: () => void;
}

export const SentenceItem: React.FC<SentenceItemProps> = ({
  sentence,
  isActive,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.containerActive]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Text style={[styles.text, isActive && styles.textActive]}>
        {sentence.text}
      </Text>
      {sentence.translation && (
        <Text style={styles.translation}>
          {sentence.translation.en || sentence.translation.vi}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.small,
    backgroundColor: colors.bgSecondary,
  },
  containerActive: {
    backgroundColor: colors.accentBlue + '30', // 30% opacity
    borderLeftWidth: 4,
    borderLeftColor: colors.accentBlue,
  },
  text: {
    ...textStyles.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  textActive: {
    color: colors.accentBlue,
    fontWeight: '600',
  },
  translation: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});

export default SentenceItem;
