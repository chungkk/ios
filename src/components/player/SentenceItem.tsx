// SentenceItem component - Single transcript sentence with highlighting

import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
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
      <View style={styles.playIconContainer}>
        <Text style={styles.playIcon}>▶</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.text, isActive && styles.textActive]}>
          {sentence.text}
        </Text>
        {sentence.translation && (
          <Text style={styles.translation}>
            {sentence.translation}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.bgSecondary,
  },
  containerActive: {
    backgroundColor: colors.accentBlue + '30', // 30% opacity
    borderLeftWidth: 4,
    borderLeftColor: colors.accentBlue,
  },
  playIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  playIcon: {
    fontSize: 12,
    color: colors.textPrimary,
    marginLeft: 2,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    ...textStyles.body,
    color: colors.textPrimary,
    lineHeight: 24,
    fontSize: 16,
  },
  textActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  translation: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
    fontSize: 14,
  },
});

export default SentenceItem;
