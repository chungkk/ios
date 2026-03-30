// VocabDetailPopup - Shows pre-defined vocabulary detail for Nachricht
// Displays: word, translation, gender, part of speech, example, context
// With save & speak functionality

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import { vocabularyService } from '../../services/vocabulary.service';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, borderRadius } from '../../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface VocabDetailData {
  word: string;
  translation: string;
  context?: string;
  gender?: string;
  plural?: string;
  partOfSpeech?: string;
  example?: string;
}

interface VocabDetailPopupProps {
  visible: boolean;
  vocabData: VocabDetailData;
  onClose: () => void;
  onSaved?: (word: string) => void;
}

const VocabDetailPopup: React.FC<VocabDetailPopupProps> = ({
  visible,
  vocabData,
  onClose,
  onSaved,
}) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSpeak = useCallback(async () => {
    try {
      const cleanW = vocabData.word.replace(/[.,!?;:"""''„\-–—]/g, '').trim();
      if (!cleanW) return;
      await Tts.getInitStatus();
      try { Tts.stop(); } catch {}
      await Tts.setDefaultLanguage('de-DE');
      await Tts.speak(cleanW);
    } catch {}
  }, [vocabData.word]);

  const handleSpeakExample = useCallback(async () => {
    if (!vocabData.example) return;
    try {
      await Tts.getInitStatus();
      try { Tts.stop(); } catch {}
      await Tts.setDefaultLanguage('de-DE');
      await Tts.speak(vocabData.example);
    } catch {}
  }, [vocabData.example]);

  const handleSave = useCallback(async () => {
    if (!user || isSaving) return;
    setIsSaving(true);
    try {
      await vocabularyService.saveVocabulary({
        word: vocabData.word,
        translation: vocabData.translation,
        context: vocabData.context || vocabData.example || '',
        gender: vocabData.gender,
        plural: vocabData.plural,
        partOfSpeech: vocabData.partOfSpeech,
      });
      setIsSaved(true);
      onSaved?.(vocabData.word);
    } catch (err: any) {
      if (err.message?.includes('already')) {
        setIsSaved(true);
      }
    } finally {
      setIsSaving(false);
    }
  }, [user, vocabData, isSaving, onSaved]);

  // Reset saved state when popup reopens with different word
  React.useEffect(() => {
    setIsSaved(false);
  }, [vocabData.word]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.popup}
          activeOpacity={1}
          onPress={() => {}}
        >
          {/* Header - Word */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.wordText}>{vocabData.word}</Text>
              <TouchableOpacity style={styles.speakButton} onPress={handleSpeak}>
                <Icon name="volume-high" size={18} color={colors.retroCyan} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={20} color={colors.retroDark} />
            </TouchableOpacity>
          </View>

          {/* Word Info Tags */}
          <View style={styles.tagsRow}>
            {vocabData.gender ? (
              <View style={[styles.tag, styles.tagGender]}>
                <Text style={styles.tagText}>{vocabData.gender}</Text>
              </View>
            ) : null}
            {vocabData.partOfSpeech ? (
              <View style={[styles.tag, styles.tagPos]}>
                <Text style={styles.tagText}>{vocabData.partOfSpeech}</Text>
              </View>
            ) : null}
            {vocabData.plural ? (
              <View style={[styles.tag, styles.tagPlural]}>
                <Text style={styles.tagText}>Pl: {vocabData.plural}</Text>
              </View>
            ) : null}
          </View>

          {/* Translation */}
          <View style={styles.translationContainer}>
            <Text style={styles.translationLabel}>NGHĨA</Text>
            <Text style={styles.translationText}>{vocabData.translation}</Text>
          </View>

          {/* Example */}
          {vocabData.example ? (
            <TouchableOpacity style={styles.exampleContainer} onPress={handleSpeakExample}>
              <View style={styles.exampleHeader}>
                <Text style={styles.exampleLabel}>VÍ DỤ</Text>
                <Icon name="volume-medium-outline" size={16} color={colors.retroCyan} />
              </View>
              <Text style={styles.exampleText}>„{vocabData.example}"</Text>
            </TouchableOpacity>
          ) : null}

          {/* Context from article */}
          {vocabData.context ? (
            <View style={styles.contextContainer}>
              <Text style={styles.contextLabel}>NGỮ CẢNH</Text>
              <Text style={styles.contextText}>{vocabData.context}</Text>
            </View>
          ) : null}

          {/* Save Button */}
          {user && (
            <View style={styles.footer}>
              {isSaved ? (
                <View style={[styles.saveButton, styles.savedButton]}>
                  <Icon name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={styles.savedText}>Đã lưu vào từ vựng</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon name="star" size={16} color="#fff" />
                      <Text style={styles.saveButtonText}>Lưu từ vựng</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  popup: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 380,
    backgroundColor: colors.retroCream,
    borderRadius: borderRadius.large,
    borderWidth: 3,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.retroYellow,
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  wordText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.retroDark,
  },
  speakButton: {
    padding: 6,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.retroCream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  tagsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.retroBorder,
  },
  tagGender: {
    backgroundColor: colors.retroPurple,
  },
  tagPos: {
    backgroundColor: colors.retroCyan,
  },
  tagPlural: {
    backgroundColor: colors.retroCoral,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'capitalize',
  },
  translationContainer: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  translationLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 4,
    letterSpacing: 1,
  },
  translationText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.retroPurple,
  },
  exampleContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  exampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exampleLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  exampleText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  contextContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 4,
    letterSpacing: 1,
  },
  contextText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.retroBorder,
    backgroundColor: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.retroCyan,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.medium,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    gap: spacing.sm,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 2,
  },
  savedButton: {
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
    borderColor: colors.success,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  savedText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
  },
});

export default VocabDetailPopup;
