// ReadingDetailScreen - Read a Nachricht article with vocabulary

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import { nachrichtService } from '../services/nachricht.service';
import { vocabularyService } from '../services/vocabulary.service';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import WordTranslatePopup from '../components/common/WordTranslatePopup';
import { colors, spacing } from '../styles/theme';
import type { ReadStackScreenProps } from '../navigation/types';
import type { Nachricht, NachrichtVocabWord } from '../types/lesson.types';

type Props = ReadStackScreenProps<'ReadingDetail'>;

const ReadingDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { nachrichtId } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [nachricht, setNachricht] = useState<Nachricht | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVocab, setShowVocab] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const [showTranslatePopup, setShowTranslatePopup] = useState(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await nachrichtService.fetchNachrichtById(nachrichtId);
        setNachricht(data);
      } catch (error) {
        console.error('[ReadingDetail] Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [nachrichtId]);

  const handleWordPress = useCallback((word: string, context: string) => {
    setSelectedWord(word);
    setSelectedContext(context);
    setShowTranslatePopup(true);
  }, []);

  const handleSaveWord = useCallback(async (vocabWord: NachrichtVocabWord) => {
    if (!user) {
      Alert.alert('Đăng nhập', 'Bạn cần đăng nhập để lưu từ vựng.');
      return;
    }

    try {
      await vocabularyService.saveVocabulary({
        word: vocabWord.word,
        translation: vocabWord.translation,
        context: vocabWord.context || vocabWord.example,
        gender: vocabWord.gender,
        plural: vocabWord.plural,
        partOfSpeech: vocabWord.partOfSpeech,
      });
      setSavedWords(prev => new Set([...prev, vocabWord.word]));
    } catch (error) {
      console.error('[ReadingDetail] Save word error:', error);
    }
  }, [user]);

  const handleSaveAllWords = useCallback(async () => {
    if (!user || !nachricht) return;

    const unsavedWords = nachricht.vocabularyWords.filter(w => !savedWords.has(w.word));
    for (const word of unsavedWords) {
      try {
        await vocabularyService.saveVocabulary({
          word: word.word,
          translation: word.translation,
          context: word.context || word.example,
          gender: word.gender,
          plural: word.plural,
          partOfSpeech: word.partOfSpeech,
        });
        setSavedWords(prev => new Set([...prev, word.word]));
      } catch (error) {
        // Word might already exist, ignore
      }
    }
    Alert.alert('Thành công', 'Đã lưu tất cả từ vựng!');
  }, [user, nachricht, savedWords]);

  const handleSpeak = useCallback((text: string) => {
    Tts.stop();
    Tts.speak(text, { language: 'de-DE' });
  }, []);

  if (loading) return <Loading />;
  if (!nachricht) return <EmptyState title="Lỗi" message="Không tìm thấy bài viết" />;

  const paragraphs = nachricht.content.split('\n\n').filter(p => p.trim());

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => handleSpeak(nachricht.title)} style={styles.headerIcon}>
            <Icon name="volume-medium-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowVocab(!showVocab)}
            style={[styles.headerIcon, showVocab && styles.headerIconActive]}
          >
            <Icon name="book-outline" size={22} color={showVocab ? '#fff' : colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {/* Article */}
        <View style={styles.article}>
          <View style={styles.metaRow}>
            <View style={[styles.levelBadge, { backgroundColor: colors.retroCyan }]}>
              <Text style={styles.levelText}>{nachricht.level}</Text>
            </View>
            <Text style={styles.sourceText}>
              {nachricht.source === 'dw' ? 'Deutsche Welle' : nachricht.source === 'tagesschau' ? 'Tagesschau' : 'PapaGeil'}
            </Text>
          </View>

          <Text style={styles.title}>{nachricht.title}</Text>

          {nachricht.summary ? (
            <Text style={styles.summary}>{nachricht.summary}</Text>
          ) : null}

          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>{paragraph}</Text>
          ))}
        </View>

        {/* Vocabulary Section */}
        {showVocab && nachricht.vocabularyWords.length > 0 && (
          <View style={styles.vocabSection}>
            <View style={styles.vocabHeader}>
              <Text style={styles.vocabTitle}>Từ vựng ({nachricht.vocabularyWords.length})</Text>
              <TouchableOpacity onPress={handleSaveAllWords} style={styles.saveAllButton}>
                <Icon name="download-outline" size={16} color="#fff" />
                <Text style={styles.saveAllText}>Lưu tất cả</Text>
              </TouchableOpacity>
            </View>

            {nachricht.vocabularyWords.map((word, index) => (
              <View key={index} style={styles.vocabCard}>
                <View style={styles.vocabWordRow}>
                  <TouchableOpacity onPress={() => handleSpeak(word.word)}>
                    <Icon name="volume-medium-outline" size={18} color={colors.retroPurple} />
                  </TouchableOpacity>
                  <Text style={styles.vocabWord}>{word.word}</Text>
                  {word.gender ? <Text style={styles.vocabGender}>({word.gender})</Text> : null}
                  {word.partOfSpeech ? <Text style={styles.vocabPos}>{word.partOfSpeech}</Text> : null}
                  <TouchableOpacity
                    onPress={() => handleSaveWord(word)}
                    style={[styles.saveButton, savedWords.has(word.word) && styles.saveButtonDone]}
                  >
                    <Icon
                      name={savedWords.has(word.word) ? 'checkmark' : 'add'}
                      size={16}
                      color={savedWords.has(word.word) ? colors.success : colors.retroPurple}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.vocabTranslation}>{word.translation}</Text>
                {word.example ? <Text style={styles.vocabExample}>"{word.example}"</Text> : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Word Translate Popup */}
      {showTranslatePopup && (
        <WordTranslatePopup
          word={selectedWord}
          context={selectedContext}
          visible={showTranslatePopup}
          onClose={() => setShowTranslatePopup(false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.retroCream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  headerIconActive: {
    backgroundColor: colors.retroPurple,
  },
  scrollView: {
    flex: 1,
  },
  article: {
    padding: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  sourceText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 32,
    marginBottom: spacing.sm,
  },
  summary: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  paragraph: {
    fontSize: 17,
    color: colors.textPrimary,
    lineHeight: 28,
    marginBottom: spacing.md,
  },
  // Vocabulary Section
  vocabSection: {
    padding: spacing.md,
    borderTopWidth: 3,
    borderTopColor: colors.retroBorder,
  },
  vocabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  vocabTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  saveAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.retroPurple,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  saveAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  vocabCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  vocabWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  vocabWord: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  vocabGender: {
    fontSize: 13,
    color: colors.retroPurple,
    fontWeight: '600',
  },
  vocabPos: {
    fontSize: 11,
    color: colors.textSecondary,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  saveButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.retroPurple,
  },
  saveButtonDone: {
    borderColor: colors.success,
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
  },
  vocabTranslation: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  vocabExample: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default ReadingDetailScreen;
