// SentenceItem component - Single transcript sentence with highlighting

import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type { Sentence } from '../../types/lesson.types';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { textStyles } from '../../styles/typography';

interface SentenceItemProps {
  sentence: Sentence;
  isActive: boolean;
  onPress?: () => void;
  showTranslation?: boolean;
  voiceRecordingResult?: {
    transcribed: string;
    original: string;
    similarity: number;
    isCorrect: boolean;
    wordComparison: Record<number, 'correct' | 'incorrect' | 'missing'>;
  } | null;
}

export const SentenceItem: React.FC<SentenceItemProps> = ({
  sentence,
  isActive,
  onPress,
  showTranslation = true,
  voiceRecordingResult = null,
}) => {
  // Render text with word-by-word highlighting based on voice recording result
  const renderText = () => {
    if (!voiceRecordingResult) {
      return (
        <Text style={[styles.text, isActive && styles.textActive]}>
          {sentence.text}
        </Text>
      );
    }

    // Split text into words while preserving punctuation
    const words = sentence.text.split(/\s+/);
    const wordComparison = voiceRecordingResult.wordComparison;

    return (
      <Text style={[styles.text, isActive && styles.textActive]}>
        {words.map((word, idx) => {
          const status = wordComparison[idx];
          let wordColor = undefined;
          
          if (status === 'correct') {
            wordColor = '#10b981'; // Green
          } else if (status === 'incorrect') {
            wordColor = '#ef4444'; // Red
          } else if (status === 'missing') {
            wordColor = '#f59e0b'; // Orange
          }

          return (
            <Text key={idx} style={wordColor ? { color: wordColor } : undefined}>
              {word}{idx < words.length - 1 ? ' ' : ''}
            </Text>
          );
        })}
      </Text>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.containerActive]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <View style={[styles.playIconContainer, isActive && styles.playIconContainerActive]}>
        <Icon name="play" size={12} color="rgba(59, 130, 246, 0.8)" style={styles.playIcon} />
      </View>
      <View style={styles.textContainer}>
        {renderText()}
        
        {/* Voice Recording Badge */}
        {voiceRecordingResult && (
          <View style={[
            styles.badge,
            voiceRecordingResult.isCorrect ? styles.badgeCorrect : styles.badgeIncorrect
          ]}>
            <Icon
              name={voiceRecordingResult.isCorrect ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={voiceRecordingResult.isCorrect ? '#10b981' : '#ef4444'}
            />
            <Text style={styles.badgeText}>
              {voiceRecordingResult.similarity}%
            </Text>
          </View>
        )}
        
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  badgeCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)', // Green background
  },
  badgeIncorrect: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)', // Red background
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default SentenceItem;
