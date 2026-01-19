// WordTranslatePopup - Click-to-translate word popup
// Neo-Retro Design - Similar to Next.js DictionaryPopup

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import { translateWord } from '../../services/translate.service';
import { vocabularyService } from '../../services/vocabulary.service';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../contexts/SettingsContext';
import { colors, spacing, borderRadius } from '../../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WordTranslatePopupProps {
  visible: boolean;
  word: string;
  context?: string; // The full sentence containing the word
  lessonId?: string;
  lessonTitle?: string;
  onClose: () => void;
}

const WordTranslatePopup: React.FC<WordTranslatePopupProps> = ({
  visible,
  word,
  context = '',
  lessonId,
  lessonTitle,
  onClose,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [translation, setTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Get target language from user or settings
  const targetLang = user?.nativeLanguage || settings.nativeLanguage || 'de';

  // Initialize TTS on component mount
  useEffect(() => {
    const initTTS = async () => {
      try {
        console.log('[WordTranslatePopup] Initializing TTS...');

        // Ignore silent switch so TTS works even in silent mode
        await Tts.setIgnoreSilentSwitch('ignore');

        // Check if TTS is available
        const voices = await Tts.voices();
        console.log('[WordTranslatePopup] Available TTS voices:', voices.length);
        console.log('[WordTranslatePopup] TTS initialized successfully');
      } catch (initError: any) {
        console.error('[WordTranslatePopup] TTS initialization error:', initError?.message || initError);
      }
    };

    initTTS();
  }, []);

  // Fetch translation when word changes
  useEffect(() => {
    if (!visible || !word) return;

    const fetchTranslation = async () => {
      setIsLoading(true);
      setError(null);
      setTranslation('');
      setIsSaved(false);

      try {
        const result = await translateWord(word, context, '', targetLang);
        setTranslation(result);

        // Auto-speak word after popup opens (in German)
        try {
          const cleanW = word.replace(/[.,!?;:"""''„-]/g, '').trim();
          if (cleanW) {
            await Tts.getInitStatus();
            // Stop any ongoing speech first (wrapped for iOS compatibility)
            try {
              Tts.stop();
            } catch {
              // Ignore stop() errors on iOS
            }
            await Tts.setDefaultLanguage('de-DE');
            await Tts.speak(cleanW);
          }
        } catch (ttsErr: any) {
          // TTS is optional, ignore errors
        }
      } catch (err) {
        console.error('[WordTranslatePopup] Error:', err);
        setError(t('translate.cannotTranslate'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslation();
  }, [visible, word, context, targetLang]);

  // Save word to vocabulary
  const handleSaveWord = useCallback(async () => {
    if (!user || !translation || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await vocabularyService.saveVocabulary({
        word,
        translation,
        context,
        lessonId,
        lessonTitle,
      });
      setIsSaved(true);
    } catch (err: any) {
      const errorMessage = err.message || t('vocabulary.deleteFailed');
      setSaveError(errorMessage);
      console.error('[WordTranslatePopup] Save error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [user, word, translation, context, lessonId, lessonTitle, isSaving]);

  // Speak word using TTS
  const handleSpeak = useCallback(async () => {
    try {
      const cleanW = word.replace(/[.,!?;:"""''„-]/g, '').trim();
      if (!cleanW) {
        console.log('[WordTranslatePopup] No word to speak (empty after cleaning)');
        return;
      }

      console.log('[WordTranslatePopup] Manual speak - word:', cleanW);

      // Ensure TTS is initialized
      await Tts.getInitStatus();

      // Stop any ongoing speech first (wrapped in separate try-catch for iOS compatibility)
      try {
        Tts.stop();
      } catch {
        // Ignore stop() errors on iOS - native bridge type conversion issue
      }

      // Set German language and speak
      await Tts.setDefaultLanguage('de-DE');
      await Tts.speak(cleanW);
      console.log('[WordTranslatePopup] Tts.speak() called successfully');
    } catch (ttsError: any) {
      console.error('[WordTranslatePopup] TTS Error:', ttsError?.message || ttsError);
    }
  }, [word]);

  // Clean word (remove punctuation for display)
  const cleanWord = word.replace(/[.,!?;:"""''„-]/g, '').trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.popup}
          activeOpacity={1}
          onPress={() => { }} // Prevent closing when tapping popup
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.wordText}>{cleanWord}</Text>
              <TouchableOpacity style={styles.speakButton} onPress={handleSpeak}>
                <Icon name="volume-high" size={18} color={colors.retroCyan} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={20} color={colors.retroDark} />
            </TouchableOpacity>
          </View>

          {/* Translation */}
          <View style={styles.translationContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.retroCyan} />
                <Text style={styles.loadingText}>{t('translate.translating')}</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <Text style={styles.translationText}>{translation}</Text>
            )}
          </View>

          {/* Context (if available) */}
          {context && (
            <View style={styles.contextContainer}>
              <Text style={styles.contextLabel}>{t('translate.context')}:</Text>
              <Text style={styles.contextText}>{context}</Text>
            </View>
          )}

          {/* Save Button */}
          {user && translation && !isLoading && (
            <View style={styles.footer}>
              {isSaved ? (
                <View style={[styles.saveButton, styles.savedButton]}>
                  <Icon name="checkmark-circle" size={18} color={colors.retroCyan} />
                  <Text style={styles.savedText}>{t('translate.saved')}</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveWord}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="star" size={16} color="#fff" />
                        <Text style={styles.saveButtonText}>{t('translate.saveWord')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {saveError && (
                    <View style={styles.saveErrorContainer}>
                      <Icon name="alert-circle" size={14} color={colors.retroCoral} />
                      <Text style={styles.saveErrorText}>{saveError}</Text>
                    </View>
                  )}
                </>
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
    maxWidth: 360,
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
  translationContainer: {
    padding: spacing.lg,
    minHeight: 60,
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  translationText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.retroPurple,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.retroCoral,
    textAlign: 'center',
  },
  contextContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  contextText: {
    fontSize: 14,
    color: colors.retroDark,
    fontStyle: 'italic',
    lineHeight: 20,
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
    backgroundColor: colors.retroCream,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  savedText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.retroCyan,
  },
  saveErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffe0e0',
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.retroCoral,
    gap: 6,
  },
  saveErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.retroCoral,
    flex: 1,
  },
});

export default WordTranslatePopup;
