// InteractiveText - Tap on words to translate & save vocabulary
// Supports: single tap on word, long press to save sentence

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import { colors, spacing } from '../../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InteractiveTextProps {
  text: string;
  style?: any;
  onWordPress?: (word: string, sentence: string) => void;
  onSentenceSave?: (sentence: string) => void;
}

const InteractiveText: React.FC<InteractiveTextProps> = ({
  text,
  style,
  onWordPress,
  onSentenceSave,
}) => {
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [showSentenceMenu, setShowSentenceMenu] = useState(false);
  const lastTapRef = useRef<number>(0);
  const lastTapWordRef = useRef<string>('');

  // Split text into words while preserving whitespace
  const words = text.split(/(\s+)/);

  const handleWordPress = useCallback((word: string, wordIndex: number) => {
    const cleanWord = word.replace(/[.,!?;:"""''„\-–—()[\]{}]/g, '').trim();
    if (!cleanWord) return;

    const now = Date.now();
    const isDoubleTap = (now - lastTapRef.current) < 400 && lastTapWordRef.current === cleanWord;
    lastTapRef.current = now;
    lastTapWordRef.current = cleanWord;

    if (isDoubleTap) {
      // Double tap → open translate popup directly
      setSelectedWordIndex(wordIndex);
      onWordPress?.(cleanWord, text);
      return;
    }

    // Single tap → highlight and open translate popup
    setSelectedWordIndex(wordIndex);
    onWordPress?.(cleanWord, text);
  }, [text, onWordPress]);

  const handleLongPress = useCallback(() => {
    // Long press → show sentence save option
    setShowSentenceMenu(true);
  }, []);

  const handleSaveSentence = useCallback(() => {
    setShowSentenceMenu(false);
    onSentenceSave?.(text);
  }, [text, onSentenceSave]);

  const handleSpeakSentence = useCallback(() => {
    setShowSentenceMenu(false);
    try {
      Tts.stop();
      Tts.speak(text, { language: 'de-DE' } as any);
    } catch {
      // TTS optional
    }
  }, [text]);

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={handleLongPress}
        delayLongPress={600}
      >
        <Text style={[styles.paragraph, style]}>
          {words.map((segment, index) => {
            // If it's whitespace, render as-is
            if (/^\s+$/.test(segment)) {
              return <Text key={index}>{segment}</Text>;
            }

            // It's a word - make it tappable
            const isSelected = selectedWordIndex === index;
            const cleanWord = segment.replace(/[.,!?;:"""''„\-–—()[\]{}]/g, '').trim();

            if (!cleanWord) {
              return <Text key={index}>{segment}</Text>;
            }

            // Find punctuation before and after the word
            const match = segment.match(/^([^a-zA-ZäöüÄÖÜß]*)(.*?)([^a-zA-ZäöüÄÖÜß]*)$/);
            const prefix = match?.[1] || '';
            const wordPart = match?.[2] || segment;
            const suffix = match?.[3] || '';

            return (
              <Text key={index}>
                {prefix ? <Text>{prefix}</Text> : null}
                <Text
                  style={[
                    styles.word,
                    isSelected && styles.wordSelected,
                  ]}
                  onPress={() => handleWordPress(wordPart, index)}
                >
                  {wordPart}
                </Text>
                {suffix ? <Text>{suffix}</Text> : null}
              </Text>
            );
          })}
        </Text>
      </TouchableOpacity>

      {/* Sentence Context Menu */}
      <Modal
        visible={showSentenceMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSentenceMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowSentenceMenu(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>📝 Câu văn</Text>
              <TouchableOpacity onPress={() => setShowSentenceMenu(false)}>
                <Icon name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.menuSentence} numberOfLines={4}>{text}</Text>

            <View style={styles.menuActions}>
              <TouchableOpacity style={styles.menuButton} onPress={handleSpeakSentence}>
                <Icon name="volume-high" size={18} color="#fff" />
                <Text style={styles.menuButtonText}>Nghe</Text>
              </TouchableOpacity>

              {onSentenceSave && (
                <TouchableOpacity
                  style={[styles.menuButton, styles.menuButtonSave]}
                  onPress={handleSaveSentence}
                >
                  <Icon name="bookmark" size={18} color="#fff" />
                  <Text style={styles.menuButtonText}>Lưu câu</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  paragraph: {
    fontSize: 17,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  word: {
    // Default: no decoration, just make it tappable
  },
  wordSelected: {
    backgroundColor: 'rgba(78, 205, 196, 0.25)',
    borderRadius: 3,
    color: colors.retroDark,
    fontWeight: '600',
  },
  // Sentence Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuContainer: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 380,
    backgroundColor: colors.retroCream,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
    backgroundColor: colors.retroYellow,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.retroDark,
  },
  menuSentence: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 26,
    padding: spacing.md,
    fontStyle: 'italic',
  },
  menuActions: {
    flexDirection: 'row',
    gap: 10,
    padding: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.retroBorder,
    backgroundColor: '#fff',
  },
  menuButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.retroCyan,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 2,
  },
  menuButtonSave: {
    backgroundColor: colors.retroPurple,
  },
  menuButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

export default InteractiveText;
