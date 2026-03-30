// InteractiveText - Double-tap on words to translate & save vocabulary
// Long press on a word to highlight and save the entire sentence

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Vibration,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import { useSettings } from '../../contexts/SettingsContext';
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
  const { settings } = useSettings();
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [highlightedSentenceIdx, setHighlightedSentenceIdx] = useState<number | null>(null);
  const [showSentenceMenu, setShowSentenceMenu] = useState(false);

  // Double-tap tracking
  const lastTapRef = useRef<{ index: number; time: number } | null>(null);
  const DOUBLE_TAP_DELAY = 300; // ms

  // Split text into words and map each to its sentence index
  const { words, wordSentenceMap, sentences } = useMemo(() => {
    const w = text.split(/(\s+)/);
    const map: number[] = [];
    const sentenceTexts: string[] = [];
    let currentSentence = 0;
    let currentSentenceText = '';

    for (let i = 0; i < w.length; i++) {
      map.push(currentSentence);
      currentSentenceText += w[i];

      const trimmed = w[i].trim();
      if (trimmed && /[.!?]$/.test(trimmed) && i < w.length - 1) {
        sentenceTexts.push(currentSentenceText.trim());
        currentSentenceText = '';
        currentSentence++;
      }
    }

    if (currentSentenceText.trim()) {
      sentenceTexts.push(currentSentenceText.trim());
    }

    return { words: w, wordSentenceMap: map, sentences: sentenceTexts };
  }, [text]);

  const handleWordPress = useCallback((word: string, wordIndex: number) => {
    const cleanWord = word.replace(/[.,!?;:"""''„\-–—()\[\]{}]/g, '').trim();
    if (!cleanWord) return;

    // Tap dismisses sentence highlight
    if (highlightedSentenceIdx !== null) {
      setHighlightedSentenceIdx(null);
      return;
    }

    const now = Date.now();
    const lastTap = lastTapRef.current;

    // Check if this is a double tap on the same word
    if (lastTap && lastTap.index === wordIndex && (now - lastTap.time) < DOUBLE_TAP_DELAY) {
      // Double tap → open translate popup
      lastTapRef.current = null;
      setSelectedWordIndex(wordIndex);
      onWordPress?.(cleanWord, text);
    } else {
      // First tap → just highlight the word
      lastTapRef.current = { index: wordIndex, time: now };
      setSelectedWordIndex(wordIndex);
    }
  }, [text, onWordPress, highlightedSentenceIdx]);

  const handleWordLongPress = useCallback((sentenceIndex: number) => {
    if (settings.hapticEnabled) {
      Vibration.vibrate(30);
    }
    setHighlightedSentenceIdx(sentenceIndex);
    setShowSentenceMenu(true);
  }, [settings.hapticEnabled]);

  const handleCloseSentenceMenu = useCallback(() => {
    setShowSentenceMenu(false);
    setHighlightedSentenceIdx(null);
  }, []);

  const handleSaveSentence = useCallback(() => {
    if (highlightedSentenceIdx !== null && sentences[highlightedSentenceIdx]) {
      onSentenceSave?.(sentences[highlightedSentenceIdx]);
    }
    handleCloseSentenceMenu();
  }, [highlightedSentenceIdx, sentences, onSentenceSave, handleCloseSentenceMenu]);

  const handleSpeakSentence = useCallback(() => {
    if (highlightedSentenceIdx !== null && sentences[highlightedSentenceIdx]) {
      try {
        Tts.stop();
        Tts.speak(sentences[highlightedSentenceIdx], { language: 'de-DE' } as any);
      } catch {
        // TTS optional
      }
    }
    handleCloseSentenceMenu();
  }, [highlightedSentenceIdx, sentences, handleCloseSentenceMenu]);

  return (
    <View>
      <Text style={[styles.paragraph, style]}>
        {words.map((segment, index) => {
          const isSentenceHighlighted = highlightedSentenceIdx === wordSentenceMap[index];

          if (/^\s+$/.test(segment)) {
            return (
              <Text
                key={index}
                style={isSentenceHighlighted ? styles.sentenceHighlight : undefined}
              >
                {segment}
              </Text>
            );
          }

          const isSelected = selectedWordIndex === index;
          const cleanWord = segment.replace(/[.,!?;:"""''„\-–—()\[\]{}]/g, '').trim();

          if (!cleanWord) {
            return <Text key={index}>{segment}</Text>;
          }

          const match = segment.match(/^([^a-zA-ZäöüÄÖÜß]*)(.*?)([^a-zA-ZäöüÄÖÜß]*)$/);
          const prefix = match?.[1] || '';
          const wordPart = match?.[2] || segment;
          const suffix = match?.[3] || '';
          const sentIdx = wordSentenceMap[index];

          return (
            <Text key={index}>
              {prefix ? (
                <Text style={isSentenceHighlighted ? styles.sentenceHighlight : undefined}>
                  {prefix}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.word,
                  isSelected && !isSentenceHighlighted && styles.wordSelected,
                  isSentenceHighlighted && styles.sentenceHighlight,
                ]}
                onPress={() => handleWordPress(wordPart, index)}
                onLongPress={() => handleWordLongPress(sentIdx)}
              >
                {wordPart}
              </Text>
              {suffix ? (
                <Text style={isSentenceHighlighted ? styles.sentenceHighlight : undefined}>
                  {suffix}
                </Text>
              ) : null}
            </Text>
          );
        })}
      </Text>

      {/* Sentence Context Menu */}
      <Modal
        visible={showSentenceMenu}
        transparent
        animationType="fade"
        onRequestClose={handleCloseSentenceMenu}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={handleCloseSentenceMenu}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>📝 Câu văn</Text>
              <TouchableOpacity onPress={handleCloseSentenceMenu}>
                <Icon name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.menuSentence} numberOfLines={4}>
              {highlightedSentenceIdx !== null ? sentences[highlightedSentenceIdx] : ''}
            </Text>

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
  sentenceHighlight: {
    backgroundColor: 'rgba(255, 230, 109, 0.45)',
    borderRadius: 3,
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
