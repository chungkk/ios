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
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  transcript,
  activeSentenceIndex,
  onSentencePress,
}) => {
  const flatListRef = useRef<FlatList>(null);

  console.log('[TranscriptView] Rendering with', transcript.length, 'sentences');
  console.log('[TranscriptView] First sentence:', transcript[0]?.text?.substring(0, 50));

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
        renderItem={({ item, index }) => (
          <SentenceItem
            sentence={item}
            isActive={index === activeSentenceIndex}
            onPress={() => handleSentencePress(index)}
          />
        )}
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
    backgroundColor: colors.bgPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
    padding: spacing.xl,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default TranscriptView;
