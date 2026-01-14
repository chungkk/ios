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
  onWordPress?: (word: string, context: string) => void;
  showTranslation?: boolean;
  recordingResults?: Record<number, {
    transcribed: string;
    original: string;
    similarity: number;
    isCorrect: boolean;
    wordComparison: Record<number, 'correct' | 'incorrect' | 'missing'>;
  }>;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  transcript,
  activeSentenceIndex,
  onSentencePress,
  onWordPress,
  showTranslation = true,
  recordingResults = {},
}) => {
  const flatListRef = useRef<FlatList>(null);
  const scrollRetryCountRef = useRef(0);
  const MAX_SCROLL_RETRIES = 3;

  // Auto-scroll to active sentence with retry mechanism
  useEffect(() => {
    if (activeSentenceIndex >= 0 && flatListRef.current) {
      scrollRetryCountRef.current = 0; // Reset retry count
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

  const handleScrollToIndexFailed = (info: { index: number }) => {
    if (scrollRetryCountRef.current < MAX_SCROLL_RETRIES) {
      scrollRetryCountRef.current += 1;
      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = 100 * Math.pow(2, scrollRetryCountRef.current - 1);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.3,
        });
      }, delay);
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
          // Get recording result for this specific sentence
          const sentenceRecordingResult = recordingResults[index] || null;

          return (
            <SentenceItem
              sentence={item}
              isActive={isActive}
              onPress={() => handleSentencePress(index)}
              onWordPress={onWordPress}
              showTranslation={showTranslation}
              voiceRecordingResult={sentenceRecordingResult}
            />
          );
        }}
        keyExtractor={(item, index) => `sentence-${index}`}
        showsVerticalScrollIndicator={true}
        onScrollToIndexFailed={handleScrollToIndexFailed}
      />
    </View>
  );
};

// Neo-Retro Style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.xl,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default TranscriptView;
