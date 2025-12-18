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
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <View style={[styles.playIconContainer, isActive && styles.playIconContainerActive]}>
        <Text style={styles.playIcon}>▶</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.text, isActive && styles.textActive]}>
          {sentence.text}
        </Text>
        {sentence.translation && (
          <Text style={[styles.translation, isActive && styles.translationActive]}>
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
    padding: spacing.lg,
    marginVertical: spacing.xs,
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.large,
    backgroundColor: '#1a2235', // Darker card background
  },
  containerActive: {
    backgroundColor: '#1e2940', // Slightly lighter when active
    borderLeftWidth: 0, // Remove border
  },
  playIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2d5cde', // Blue play button
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  playIconContainerActive: {
    backgroundColor: '#3b82f6', // Brighter blue when active
  },
  playIcon: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 3,
  },
  textContainer: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  text: {
    fontSize: 17,
    color: colors.textPrimary,
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  textActive: {
    fontWeight: '500',
  },
  translation: {
    fontSize: 15,
    color: '#7b8ba3', // Muted blue-gray
    marginTop: spacing.sm,
    fontStyle: 'italic',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  translationActive: {
    color: '#8b9bb3', // Slightly brighter when active
  },
});

export default SentenceItem;
