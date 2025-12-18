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
  showTranslation?: boolean;
}

export const SentenceItem: React.FC<SentenceItemProps> = ({
  sentence,
  isActive,
  onPress,
  showTranslation = true,
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
        {showTranslation && sentence.translation && (
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
    padding: 14,
    marginVertical: 4,
    marginHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1a1e2e', // Dark card background (--bg-primary)
    borderWidth: 1,
    borderColor: 'transparent',
    opacity: 0.7,
  },
  containerActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.06)', // Subtle blue tint
    opacity: 1,
    borderWidth: 1,
    borderColor: '#3b82f6', // Blue border
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  playIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // Blue tint
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  playIconContainerActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)', // Brighter blue when active
  },
  playIcon: {
    fontSize: 11,
    color: 'rgba(59, 130, 246, 0.8)',
    marginLeft: 2,
  },
  textContainer: {
    flex: 1,
    paddingTop: 2,
  },
  text: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)', // Muted white for inactive
    lineHeight: 26,
    fontWeight: '500',
    letterSpacing: 0.01,
  },
  textActive: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)', // Bright white for active
  },
  translation: {
    fontSize: 13,
    color: 'rgba(148, 163, 184, 0.7)', // Muted for inactive
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 22,
    letterSpacing: 0,
  },
  translationActive: {
    fontSize: 13,
    color: 'rgba(148, 163, 184, 0.95)', // Slightly brighter for active
    fontWeight: '400',
  },
});

export default SentenceItem;
