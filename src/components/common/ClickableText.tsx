// ClickableText - Makes each word in text clickable for translation
// Used in Shadowing and Dictation screens

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { colors } from '../../styles/theme';

interface ClickableTextProps {
  text: string;
  onWordPress: (word: string, context: string) => void;
  style?: TextStyle;
  wordStyle?: TextStyle;
  activeWordStyle?: TextStyle;
  containerStyle?: ViewStyle;
  highlightedWord?: string; // Optional: highlight a specific word
}

const ClickableText: React.FC<ClickableTextProps> = ({
  text,
  onWordPress,
  style,
  wordStyle,
  activeWordStyle,
  containerStyle,
  highlightedWord,
}) => {
  // Split text into words while preserving punctuation
  const words = useMemo(() => {
    // Split by spaces but keep punctuation attached
    return text.split(/(\s+)/).filter(part => part.length > 0);
  }, [text]);

  const handleWordPress = (word: string) => {
    // Remove punctuation for the callback
    const cleanWord = word.replace(/[.,!?;:"""''„\-()[\]]/g, '').trim();
    if (cleanWord.length > 0) {
      onWordPress(cleanWord, text);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={style}>
        {words.map((word, index) => {
          // Check if this is whitespace
          if (/^\s+$/.test(word)) {
            return <Text key={index}>{word}</Text>;
          }

          // Clean word for comparison
          const cleanWord = word.replace(/[.,!?;:"""''„\-()[\]]/g, '').toLowerCase();
          const isHighlighted = highlightedWord && cleanWord === highlightedWord.toLowerCase();

          return (
            <Text
              key={index}
              style={[
                styles.word,
                wordStyle,
                isHighlighted && styles.highlightedWord,
                isHighlighted && activeWordStyle,
              ]}
              onPress={() => handleWordPress(word)}
            >
              {word}
            </Text>
          );
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  word: {
    // Underline style to indicate clickable
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: colors.textMuted,
  },
  highlightedWord: {
    backgroundColor: colors.retroYellow,
    borderRadius: 2,
    textDecorationLine: 'none',
  },
});

export default ClickableText;
