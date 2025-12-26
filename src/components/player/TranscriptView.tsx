// TranscriptView component - Scrollable transcript with auto-scroll to active sentence

import React, { useEffect, useRef } from 'react';
import { FlatList, StyleSheet, View, Text } from 'react-native';
import type { Sentence } from '../../types/lesson.types';
import SentenceItem from './SentenceItem';
import { colors, spacing } from '../../styles/theme';
import { textStyles } from '../../styles/typography';

interface TranscriptViewProps {
  transcript: Sentence[];
  activeSentenceIndex: number;
  onSentencePress?: (index: number) => void;
  showTranslation?: boolean;
  voiceRecordingResult?: {
    transcribed: string;
    original: string;
    similarity: number;
    isCorrect: boolean;
    wordComparison: Record<number, 'correct' | 'incorrect' | 'missing'>;
  } | null;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  transcript,
  activeSentenceIndex,
  onSentencePress,
  showTranslation = true,
  voiceRecordingResult = null,
}) => {
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to active sentence
  useEffect(() => {
    if (activeSentenceIndex >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: activeSentenceIndex,
        animated: true,
        viewPosition: 0.3, // Show active sentence at 30% from top
      });
    }
  }, [activeSentenceIndex]);

  const handleSentencePress = (index: number) => {
    if (onSentencePress) {
      onSentencePress(index);
    }
  };

  // Show empty state if no transcript
  if (transcript.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No transcript available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={transcript}
        renderItem={({ item, index }) => {
          const isActive = index === activeSentenceIndex;
          const hasRecording = isActive && voiceRecordingResult;
          
          return (
          <SentenceItem
            sentence={item}
            isActive={isActive}
            onPress={() => handleSentencePress(index)}
            showTranslation={showTranslation}
            voiceRecordingResult={hasRecording ? voiceRecordingResult : null}
          />
        );
        }}
        keyExtractor={(item, index) => `sentence-${index}`}
        showsVerticalScrollIndicator={true}
        onScrollToIndexFailed={(info) => {
          // Handle scroll failure (e.g., item not in view yet)
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.3,
            });
          }, 100);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e', // Match dark theme
    paddingTop: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0f1e',
    padding: spacing.xl,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default TranscriptView;
