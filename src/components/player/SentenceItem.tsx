// SentenceItem component - Single transcript sentence with highlighting

import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type { Sentence } from '../../types/lesson.types';
import { colors } from '../../styles/theme';

interface SentenceItemProps {
  sentence: Sentence;
  isActive: boolean;
  onPress?: () => void;
  onWordPress?: (word: string, context: string) => void;
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
  onWordPress,
  showTranslation = true,
  voiceRecordingResult = null,
}) => {
  // Handle word click for translation
  const handleWordPress = (word: string) => {
    if (onWordPress) {
      const cleanWord = word.replace(/[.,!?;:"""''„\-()[\]]/g, '').trim();
      if (cleanWord.length > 0) {
        onWordPress(cleanWord, sentence.text);
      }
    }
  };
  // Render text with word-by-word highlighting based on voice recording result
  const renderText = () => {
    // Split text into words while preserving punctuation
    const words = sentence.text.split(/\s+/);
    const wordComparison = voiceRecordingResult?.wordComparison;

    return (
      <Text style={[styles.text, isActive && styles.textActive]}>
        {words.map((word, idx) => {
          let wordStyle: any = onWordPress ? styles.clickableWord : undefined;
          
          // Apply voice recording color if available
          if (wordComparison) {
            const status = wordComparison[idx];
            if (status === 'correct') {
              wordStyle = [wordStyle, { color: '#10b981' }]; // Green
            } else if (status === 'incorrect') {
              wordStyle = [wordStyle, { color: '#ef4444' }]; // Red
            } else if (status === 'missing') {
              wordStyle = [wordStyle, { color: '#f59e0b' }]; // Orange
            }
          }

          return (
            <Text
              key={idx}
              style={wordStyle}
              onPress={onWordPress ? () => handleWordPress(word) : undefined}
            >
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

// Neo-Retro Style
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.retroCream,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    opacity: 0.85,
  },
  containerActive: {
    backgroundColor: '#fff',
    opacity: 1,
    borderWidth: 2,
    borderColor: colors.retroCyan,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 4,
  },
  playIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 188, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  playIconContainerActive: {
    backgroundColor: colors.retroCyan,
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
    color: colors.retroDark,
    lineHeight: 24,
    fontWeight: '500',
    opacity: 0.8,
  },
  textActive: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.retroDark,
    opacity: 1,
  },
  clickableWord: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: colors.retroCyan,
  },
  translation: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  translationActive: {
    fontSize: 13,
    color: colors.retroPurple,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.retroBorder,
  },
  badgeCorrect: {
    backgroundColor: '#d4edda',
  },
  badgeIncorrect: {
    backgroundColor: '#f8d7da',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.retroDark,
  },
});

export default SentenceItem;
