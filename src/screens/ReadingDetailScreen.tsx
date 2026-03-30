// ReadingDetailScreen - Professional article reader with elevated content blocks
// Interactive text: double-tap word to translate, long press to save sentence

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Linking,
  Dimensions,
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
import InteractiveText from '../components/common/InteractiveText';
import VocabDetailPopup, { VocabDetailData } from '../components/common/VocabDetailPopup';
import { colors, spacing } from '../styles/theme';
import type { ReadStackScreenProps } from '../navigation/types';
import type { Nachricht, NachrichtVocabWord } from '../types/lesson.types';

type Props = ReadStackScreenProps<'ReadingDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LEVEL_COLORS: Record<string, string> = {
  A1: '#4ECDC4', A2: '#7FDBDA', B1: '#F4B942',
  B2: '#FF6B6B', C1: '#FF8ED4', C2: '#A855F7',
};

const SOURCE_LABELS: Record<string, { label: string; emoji: string }> = {
  dw: { label: 'Deutsche Welle', emoji: '🇩🇪' },
  tagesschau: { label: 'Tagesschau', emoji: '📺' },
  manual: { label: 'PapaGeil', emoji: '✍️' },
};

const estimateReadTime = (content: string): number => {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 150));
};

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
  const [showVocabDetailPopup, setShowVocabDetailPopup] = useState(false);
  const [matchedVocab, setMatchedVocab] = useState<VocabDetailData | null>(null);
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
    if (nachricht?.vocabularyWords?.length) {
      const normalizeWord = (w: string) => w.toLowerCase().replace(/[.,!?;:"""''\u201E\-\u2013\u2014()\[\]{}]/g, '').trim();
      const normalizedInput = normalizeWord(word);

      const matched = nachricht.vocabularyWords.find(v => {
        const vocabWord = normalizeWord(v.word);
        const withoutArticle = vocabWord.replace(/^(der|die|das|ein|eine)\s+/i, '');
        return vocabWord === normalizedInput
          || withoutArticle === normalizedInput
          || vocabWord.includes(normalizedInput)
          || normalizedInput.includes(withoutArticle);
      });

      if (matched) {
        setMatchedVocab({
          word: matched.word,
          translation: matched.translation,
          context: matched.context || context,
          gender: matched.gender,
          plural: matched.plural,
          partOfSpeech: matched.partOfSpeech,
          example: matched.example,
        });
        setShowVocabDetailPopup(true);
        return;
      }
    }

    setSelectedWord(word);
    setSelectedContext(context);
    setShowTranslatePopup(true);
  }, [nachricht]);

  const handleSaveSentence = useCallback(async (sentence: string) => {
    if (!user) {
      Alert.alert('Đăng nhập', 'Bạn cần đăng nhập để lưu câu.');
      return;
    }
    try {
      await vocabularyService.saveVocabulary({
        word: sentence.substring(0, 60) + (sentence.length > 60 ? '...' : ''),
        translation: '',
        context: sentence,
        notes: 'Saved sentence from reading',
      });
      Alert.alert('✅ Đã lưu', 'Câu đã được lưu vào từ vựng!');
    } catch (error: any) {
      if (error.message?.includes('already')) {
        Alert.alert('ℹ️', 'Câu này đã được lưu trước đó.');
      } else {
        Alert.alert('Lỗi', 'Không thể lưu câu.');
      }
    }
  }, [user]);

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
      } catch {}
    }
    Alert.alert('Thành công', 'Đã lưu tất cả từ vựng!');
  }, [user, nachricht, savedWords]);

  const handleSpeak = useCallback((text: string) => {
    Tts.stop();
    Tts.speak(text, { language: 'de-DE' } as any);
  }, []);

  if (loading) return <Loading />;
  if (!nachricht) return <EmptyState title="Lỗi" message="Không tìm thấy bài viết" />;

  const paragraphs = nachricht.content.split('\n\n').filter(p => p.trim());
  const readTime = estimateReadTime(nachricht.content);
  const vocabCount = nachricht.vocabularyWords?.length || 0;
  const levelColor = LEVEL_COLORS[nachricht.level?.toUpperCase()] || colors.retroCyan;
  const sourceInfo = SOURCE_LABELS[nachricht.source] || { label: nachricht.source, emoji: '📄' };

  return (
    <SafeAreaView style={styles.container}>
      {/* Minimal Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => handleSpeak(nachricht.title)} style={styles.headerBtn}>
            <Icon name="volume-medium-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowVocab(!showVocab)}
            style={[styles.headerBtn, showVocab && styles.headerBtnActive]}
          >
            <Icon name="book-outline" size={20} color={showVocab ? '#fff' : colors.textPrimary} />
            {vocabCount > 0 && (
              <View style={[styles.vocabBadge, showVocab && { backgroundColor: '#fff' }]}>
                <Text style={[styles.vocabBadgeText, showVocab && { color: colors.retroPurple }]}>{vocabCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero Title Area ─── */}
        <View style={styles.heroSection}>
          {/* Meta chips */}
          <View style={styles.metaRow}>
            <View style={[styles.levelChip, { backgroundColor: levelColor }]}>
              <Text style={styles.levelChipText}>{nachricht.level}</Text>
            </View>
            <View style={styles.sourceChip}>
              <Text style={styles.sourceEmoji}>{sourceInfo.emoji}</Text>
              <Text style={styles.sourceLabel}>{sourceInfo.label}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>{nachricht.title}</Text>

          {/* Summary */}
          {nachricht.summary ? (
            <Text style={styles.heroSummary}>{nachricht.summary}</Text>
          ) : null}

          {/* Stats bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Icon name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.statText}>{readTime} min đọc</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="book-outline" size={14} color={colors.textMuted} />
              <Text style={styles.statText}>{vocabCount} từ vựng</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="eye-outline" size={14} color={colors.textMuted} />
              <Text style={styles.statText}>{nachricht.viewCount} lượt</Text>
            </View>
          </View>
        </View>

        {/* ─── Content Card (Elevated) ─── */}
        <View style={styles.contentCard}>
          {/* Article indicator */}
          <View style={styles.contentHeader}>
            <View style={[styles.contentAccent, { backgroundColor: levelColor }]} />
            <Text style={styles.contentLabel}>Nội dung bài viết</Text>
          </View>

          {/* Paragraphs */}
          <View style={styles.contentBody}>
            {paragraphs.map((paragraph, index) => (
              <View key={index} style={index < paragraphs.length - 1 ? styles.paragraphWrapper : undefined}>
                <InteractiveText
                  text={paragraph}
                  style={styles.paragraph}
                  onWordPress={handleWordPress}
                  onSentenceSave={handleSaveSentence}
                />
              </View>
            ))}
          </View>

          {/* Source link at bottom of content card */}
          {nachricht.sourceUrl ? (
            <TouchableOpacity
              style={styles.sourceLink}
              onPress={() => Linking.openURL(nachricht.sourceUrl)}
              activeOpacity={0.7}
            >
              <View style={styles.sourceLinkIcon}>
                <Icon name="link-outline" size={14} color={colors.retroPurple} />
              </View>
              <View style={styles.sourceLinkContent}>
                <Text style={styles.sourceLinkLabel}>Quelle</Text>
                <Text style={styles.sourceLinkUrl} numberOfLines={1}>
                  {(() => {
                    try { return new URL(nachricht.sourceUrl).hostname.replace('www.', ''); }
                    catch { return nachricht.sourceUrl; }
                  })()}
                </Text>
              </View>
              <Icon name="open-outline" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ─── Vocabulary Section (Elevated) ─── */}
        {showVocab && vocabCount > 0 && (
          <View style={styles.vocabCard}>
            <View style={styles.vocabCardHeader}>
              <View style={styles.vocabTitleRow}>
                <Icon name="book" size={20} color={colors.retroPurple} />
                <Text style={styles.vocabTitle}>Từ vựng</Text>
                <View style={styles.vocabCountChip}>
                  <Text style={styles.vocabCountText}>{vocabCount}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleSaveAllWords} style={styles.saveAllButton}>
                <Icon name="download-outline" size={15} color="#fff" />
                <Text style={styles.saveAllText}>Lưu tất cả</Text>
              </TouchableOpacity>
            </View>

            {nachricht.vocabularyWords.map((word, index) => (
              <View
                key={index}
                style={[
                  styles.vocabItem,
                  index < nachricht.vocabularyWords.length - 1 && styles.vocabItemBorder,
                ]}
              >
                <View style={styles.vocabWordRow}>
                  <TouchableOpacity
                    onPress={() => handleSpeak(word.word)}
                    style={styles.speakBtn}
                  >
                    <Icon name="volume-medium-outline" size={16} color={colors.retroPurple} />
                  </TouchableOpacity>
                  <View style={styles.vocabWordContent}>
                    <View style={styles.vocabWordLine}>
                      <Text style={styles.vocabWord}>{word.word}</Text>
                      {word.gender ? (
                        <Text style={styles.vocabGender}>{word.gender}</Text>
                      ) : null}
                      {word.partOfSpeech ? (
                        <View style={styles.posBadge}>
                          <Text style={styles.posText}>{word.partOfSpeech}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.vocabTranslation}>{word.translation}</Text>
                    {word.example ? (
                      <Text style={styles.vocabExample}>„{word.example}"</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleSaveWord(word)}
                    style={[styles.saveWordBtn, savedWords.has(word.word) && styles.saveWordBtnDone]}
                  >
                    <Icon
                      name={savedWords.has(word.word) ? 'checkmark' : 'add'}
                      size={16}
                      color={savedWords.has(word.word) ? '#fff' : colors.retroPurple}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tip at bottom */}
        <View style={styles.tipRow}>
          <Icon name="finger-print-outline" size={14} color={colors.textMuted} />
          <Text style={styles.tipText}>Nhấn đúp vào từ để dịch · Nhấn giữ để lưu câu</Text>
        </View>
      </ScrollView>

      {/* Popups */}
      {showTranslatePopup && (
        <WordTranslatePopup
          word={selectedWord}
          context={selectedContext}
          visible={showTranslatePopup}
          onClose={() => setShowTranslatePopup(false)}
        />
      )}

      {showVocabDetailPopup && matchedVocab && (
        <VocabDetailPopup
          visible={showVocabDetailPopup}
          vocabData={matchedVocab}
          onClose={() => setShowVocabDetailPopup(false)}
          onSaved={(word) => setSavedWords(prev => new Set([...prev, word]))}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EDE4', // Slightly warmer than retroCream for depth contrast
  },

  // ─── Header ───
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerBtnActive: {
    backgroundColor: colors.retroPurple,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  vocabBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.retroPurple,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  vocabBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },

  scrollView: {
    flex: 1,
  },

  // ─── Hero Title Area ───
  heroSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  levelChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceEmoji: {
    fontSize: 12,
  },
  sourceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSummary: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },

  // ─── Content Card ───
  contentCard: {
    marginHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: spacing.md,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
  },
  contentAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  contentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  contentBody: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  paragraphWrapper: {
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 17,
    color: colors.textPrimary,
    lineHeight: 30,
  },

  // Source link
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(138, 92, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(138, 92, 255, 0.12)',
  },
  sourceLinkIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(138, 92, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceLinkContent: {
    flex: 1,
  },
  sourceLinkLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceLinkUrl: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.retroPurple,
    marginTop: 1,
  },

  // ─── Vocabulary Card ───
  vocabCard: {
    marginHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  vocabCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: 'rgba(168, 85, 247, 0.04)',
  },
  vocabTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vocabTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  vocabCountChip: {
    backgroundColor: colors.retroPurple,
    borderRadius: 10,
    minWidth: 24,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  vocabCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  saveAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.retroPurple,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  saveAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // Vocab items
  vocabItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  vocabItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  vocabWordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  speakBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  vocabWordContent: {
    flex: 1,
  },
  vocabWordLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  vocabWord: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  vocabGender: {
    fontSize: 12,
    color: colors.retroPurple,
    fontWeight: '600',
  },
  posBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  posText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  vocabTranslation: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  vocabExample: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 3,
    lineHeight: 18,
  },
  saveWordBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.retroPurple,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  saveWordBtnDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },

  // ─── Tip Row ───
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginHorizontal: 12,
  },
  tipText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
});

export default ReadingDetailScreen;
