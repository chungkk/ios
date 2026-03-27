// VocabularyScreen - Smart Vocabulary Learning
// Neo-Retro Design with SRS Integration + Full Website Features

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import { vocabularyService, VocabularyItem } from '../services/vocabulary.service';
import { savedSentencesService, SavedSentence } from '../services/savedSentences.service';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/common/Loading';
import FlashcardMode from '../components/vocabulary/FlashcardMode';
import AddWordModal from '../components/vocabulary/AddWordModal';
import LearnMode from '../components/vocabulary/LearnMode';
// VocabChart moved to SettingsScreen
import { SRSCard } from '../utils/srs';
import { getWordsForReview } from '../utils/vocabExerciseEngine';
import { colors, spacing } from '../styles/theme';

const ITEMS_PER_PAGE = 15;

// Word status types
type WordStatus = 'all' | 'new' | 'learning' | 'mastered';
type ViewMode = 'words' | 'sentences';

// Helper function to classify word status based on SRS state
const getWordStatusFromSRS = (item: VocabularyItem): WordStatus => {
  // Use actual status field if available
  if (item.status) {
    switch (item.status) {
      case 'new': return 'new';
      case 'learning': return 'learning';
      case 'mastered': return 'mastered';
    }
  }
  // Fallback to SRS state
  if (item.srsState) {
    switch (item.srsState) {
      case 'new': return 'new';
      case 'learning':
      case 'relearning': return 'learning';
      case 'review': return 'mastered';
      default: return 'new';
    }
  }
  return 'new';
};

const VocabularyScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();

  // iPad detection and scaling
  const IPAD_BREAKPOINT = 768;
  const isIPad = screenWidth >= IPAD_BREAKPOINT;

  // Dynamic styles for iPad optimization
  const dynamicStyles = useMemo(() => ({
    notLoggedInCard: { maxWidth: isIPad ? 520 : 320 },
    notLoggedInEmoji: { fontSize: isIPad ? 72 : 48, marginBottom: isIPad ? 16 : 8 },
    notLoggedInTitle: { fontSize: isIPad ? 32 : 22, marginBottom: isIPad ? 24 : 16 },
    notLoggedInDivider: { width: isIPad ? 80 : 60, height: isIPad ? 4 : 3, marginBottom: isIPad ? 28 : 20 },
    notLoggedInIcon: { size: isIPad ? 56 : 40, marginBottom: isIPad ? 16 : 12 },
    notLoggedInMessage: { fontSize: isIPad ? 22 : 16, marginBottom: isIPad ? 12 : 8 },
    notLoggedInHint: { fontSize: isIPad ? 18 : 14, lineHeight: isIPad ? 28 : 20 },
    notLoggedInContent: { padding: isIPad ? 40 : 24 },
    notLoggedInFeatures: { gap: isIPad ? 28 : 16, marginTop: isIPad ? 36 : 24 },
    featureItem: { paddingVertical: isIPad ? 20 : 12, paddingHorizontal: isIPad ? 28 : 16, borderRadius: isIPad ? 16 : 12 },
    featureIcon: { fontSize: isIPad ? 36 : 24, marginBottom: isIPad ? 8 : 4 },
    featureText: { fontSize: isIPad ? 15 : 11 },
  }), [isIPad]);

  // State
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLearn, setShowLearn] = useState(false);
  const [activeFilter, setActiveFilter] = useState<WordStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('words');
  const [savedSentences, setSavedSentences] = useState<SavedSentence[]>([]);

  // Initialize TTS on mount
  useEffect(() => {
    const initTTS = async () => {
      try {
        await Tts.setIgnoreSilentSwitch('ignore');
      } catch (error) {
        console.error('[VocabularyScreen] TTS init error:', error);
      }
    };
    initTTS();
  }, []);

  // Fetch vocabulary
  const fetchVocabulary = useCallback(async () => {
    if (!user) {
      setVocabulary([]);
      setLoading(false);
      return;
    }
    try {
      const data = await vocabularyService.fetchVocabulary();
      setVocabulary(data);
    } catch (error) {
      console.error('Failed to fetch vocabulary:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchVocabulary();
      // Also load saved sentences
      savedSentencesService.getSavedSentences().then(setSavedSentences).catch(() => {});
    }, [fetchVocabulary])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVocabulary();
    const sentences = await savedSentencesService.getSavedSentences().catch(() => [] as SavedSentence[]);
    setSavedSentences(sentences);
    setRefreshing(false);
  }, [fetchVocabulary]);

  // Navigation for saved sentences
  const navigation = useNavigation<any>();

  const handleSentenceNavigate = useCallback((sentence: SavedSentence) => {
    // Parse sentence index from id format: `${lessonId}_${index}`
    const parts = sentence.id.split('_');
    const sentenceIndex = parseInt(parts[parts.length - 1], 10);
    navigation.navigate('Home', {
      screen: 'Lesson',
      params: {
        lessonId: sentence.lessonId,
        initialSentenceIndex: isNaN(sentenceIndex) ? undefined : sentenceIndex,
      },
    });
  }, [navigation]);

  // Delete saved sentence
  const handleDeleteSentence = useCallback(async (id: string) => {
    Alert.alert(
      'Xóa câu đã lưu?',
      'Bạn có chắc muốn xóa câu này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await savedSentencesService.removeSentence(id);
              setSavedSentences(prev => prev.filter(s => s.id !== id));
            } catch {
              Alert.alert('Lỗi', 'Không thể xóa câu');
            }
          },
        },
      ]
    );
  }, []);

  // Speak sentence using TTS
  const handleSpeakSentence = useCallback(async (text: string) => {
    try {
      await Tts.getInitStatus();
      try { Tts.stop(); } catch {}
      await Tts.setDefaultLanguage('de-DE');
      await Tts.speak(text);
    } catch (err: any) {
      console.error('[VocabularyScreen] TTS Error:', err?.message || err);
    }
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const counts = { new: 0, learning: 0, mastered: 0 };
    vocabulary.forEach(v => {
      const status = getWordStatusFromSRS(v);
      if (status !== 'all') {
        counts[status]++;
      }
    });
    return { total: vocabulary.length, ...counts };
  }, [vocabulary]);

  // Pending review words
  const pendingReview = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return vocabulary.filter(v => {
      if (v.status === 'mastered') return false;
      const created = new Date(v.createdAt);
      const isToday = created >= todayStart;
      const isDue = !v.nextReviewAt || new Date(v.nextReviewAt) <= new Date();
      return isToday || isDue;
    });
  }, [vocabulary]);

  // Filter and search
  const filteredVocabulary = useMemo(() => {
    let filtered = vocabulary;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(v => getWordStatusFromSRS(v) === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.word.toLowerCase().includes(query) ||
        v.translation.toLowerCase().includes(query) ||
        (v.example && v.example.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [vocabulary, activeFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredVocabulary.length / ITEMS_PER_PAGE);
  const paginatedVocabulary = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVocabulary.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVocabulary, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  // Delete word
  const handleDelete = useCallback(async (id: string) => {
    Alert.alert(
      t('vocabulary.deleteConfirm'),
      t('vocabulary.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await vocabularyService.deleteVocabulary(id);
              setVocabulary(prev => prev.filter(item => item.id !== id));
            } catch {
              Alert.alert(t('common.error'), t('vocabulary.deleteFailed'));
            }
          },
        },
      ]
    );
  }, [t]);

  // Update word status
  const handleUpdateStatus = useCallback(async (vocab: VocabularyItem) => {
    const newStatus = vocab.status === 'new' ? 'learning' :
      vocab.status === 'learning' ? 'mastered' : 'learning';
    try {
      await vocabularyService.updateVocabulary({
        id: vocab.id,
        status: newStatus,
        reviewCount: (vocab.reviewCount || 0) + 1,
      });
      setVocabulary(prev => prev.map(v =>
        v.id === vocab.id ? { ...v, status: newStatus, reviewCount: (v.reviewCount || 0) + 1 } : v
      ));
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  }, []);

  // AI Enrich word
  const handleEnrichWord = useCallback(async (vocab: VocabularyItem) => {
    setEnrichingIds(prev => new Set(prev).add(vocab.id));
    try {
      const data = await vocabularyService.lookupDictionary(vocab.word);
      const updateFields: any = {};
      if (data.translation) updateFields.translation = data.translation;
      if (data.gender) updateFields.gender = data.gender;
      if (data.plural) updateFields.plural = data.plural;
      if (data.pronunciation) updateFields.pronunciation = data.pronunciation;
      if (data.partOfSpeech) updateFields.partOfSpeech = data.partOfSpeech;
      if (data.grammar) updateFields.grammar = data.grammar;
      if (data.baseForm) updateFields.baseForm = data.baseForm;
      if (data.explanation) updateFields.notes = data.explanation;
      if (data.examples?.[0]) {
        const ex = data.examples[0];
        updateFields.example = typeof ex === 'string' ? ex : (ex as any).de || '';
      }

      await vocabularyService.updateVocabulary({ id: vocab.id, ...updateFields });
      setVocabulary(prev => prev.map(v =>
        v.id === vocab.id ? { ...v, ...updateFields } : v
      ));
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật bằng AI');
    } finally {
      setEnrichingIds(prev => {
        const next = new Set(prev);
        next.delete(vocab.id);
        return next;
      });
    }
  }, []);

  // Handle SRS card update from flashcard mode
  const handleUpdateCard = useCallback(async (card: SRSCard) => {
    try {
      await vocabularyService.updateVocabulary({
        id: card.id,
        srsState: card.state,
        srsEase: card.ease,
        srsInterval: card.interval,
        srsStepIndex: card.stepIndex,
        srsDue: card.due.toISOString(),
        srsReviews: card.reviews,
        srsLapses: card.lapses,
        srsLastReview: card.lastReview?.toISOString() ?? null,
      });
      setVocabulary(prev => prev.map(v =>
        v.id === card.id ? {
          ...v,
          srsState: card.state,
          srsEase: card.ease,
          srsInterval: card.interval,
          srsStepIndex: card.stepIndex,
          srsDue: card.due.toISOString(),
          srsReviews: card.reviews,
          srsLapses: card.lapses,
          srsLastReview: card.lastReview?.toISOString() ?? null,
        } : v
      ));
    } catch (error) {
      console.error('Failed to update SRS card:', error);
    }
  }, []);

  // Handle word added from AddWordModal
  const handleWordAdded = useCallback((word: VocabularyItem) => {
    setVocabulary(prev => [word, ...prev]);
  }, []);

  // Handle vocab update from Learn Mode
  const handleLearnUpdate = useCallback((updated: VocabularyItem) => {
    setVocabulary(prev => prev.map(v => v.id === updated.id ? updated : v));
  }, []);

  // Speak word using TTS
  const handleSpeak = useCallback(async (word: string) => {
    try {
      const cleanW = word.replace(/[.,!?;:"""''„-]/g, '').trim();
      if (!cleanW) return;
      await Tts.getInitStatus();
      try { Tts.stop(); } catch {}
      await Tts.setDefaultLanguage('de-DE');
      await Tts.speak(cleanW);
    } catch (ttsError: any) {
      console.error('[VocabularyScreen] TTS Error:', ttsError?.message || ttsError);
    }
  }, []);

  // Render word card (enhanced with website features)
  const renderItem = ({ item, index }: { item: VocabularyItem; index: number }) => {
    const status = getWordStatusFromSRS(item);
    const statusConfig: Record<WordStatus, { icon: string; color: string; label: string }> = {
      all: { icon: '📚', color: colors.retroPurple, label: 'Tất cả' },
      new: { icon: '🆕', color: colors.retroCoral, label: 'Mới' },
      learning: { icon: '📖', color: colors.retroYellow, label: 'Đang học' },
      mastered: { icon: '✅', color: colors.retroCyan, label: 'Thuộc' },
    };
    const config = statusConfig[status] || statusConfig.new;
    const isEnriching = enrichingIds.has(item.id);
    const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;

    return (
      <View style={styles.wordCard}>
        <View style={[styles.cardAccent, { backgroundColor: config.color }]} />
        <View style={styles.cardBody}>
          {/* Header row: word + speaker + status + actions */}
          <View style={styles.cardHeader}>
            <View style={styles.wordInfo}>
              <Text style={styles.wordIndex}>{globalIndex}</Text>
              <TouchableOpacity
                style={styles.speakBtn}
                onPress={() => handleSpeak(item.word)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="volume-high" size={16} color={colors.retroCyan} />
              </TouchableOpacity>
              {item.gender && <Text style={styles.wordGender}>{item.gender}</Text>}
              <Text style={styles.word}>{item.word}</Text>
              <Text style={styles.wordSeparator}>—</Text>
              <Text style={styles.translation} numberOfLines={1}>{item.translation}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
              <Text style={styles.statusIcon}>{config.icon}</Text>
            </View>
          </View>

          {/* Extended details */}
          <View style={styles.detailsRow}>
            {item.pronunciation && (
              <Text style={styles.detailIPA}>{item.pronunciation}</Text>
            )}
            {item.plural && (
              <Text style={styles.detailTag}>Pl: {item.plural}</Text>
            )}
            {item.partOfSpeech && (
              <View style={styles.posBadge}>
                <Text style={styles.posText}>{item.partOfSpeech}</Text>
              </View>
            )}
          </View>

          {item.baseForm && item.baseForm.toLowerCase() !== item.word.toLowerCase() && (
            <Text style={styles.detailBaseForm}>Grundform: {item.baseForm}</Text>
          )}

          {item.grammar && (
            <Text style={styles.detailGrammar}>{item.grammar}</Text>
          )}

          {item.example && (
            <Text style={styles.context} numberOfLines={2}>
              „{item.example}"
            </Text>
          )}

          {item.context && !item.example && (
            <Text style={styles.context} numberOfLines={2}>
              „{item.context}"
            </Text>
          )}

          {item.lessonTitle && (
            <View style={styles.sourceTag}>
              <Icon name="videocam-outline" size={11} color={colors.retroPurple} />
              <Text style={styles.sourceText} numberOfLines={1}>{item.lessonTitle}</Text>
            </View>
          )}

          {/* Actions row */}
          <View style={styles.actionsRow}>
            {/* Status toggle */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleUpdateStatus(item)}
            >
              <Text style={styles.actionBtnText}>
                {item.status === 'mastered' ? '🔄' : item.status === 'new' ? '📝' : '✅'}
              </Text>
            </TouchableOpacity>

            {/* AI Enrich */}
            <TouchableOpacity
              style={[styles.actionBtn, isEnriching && styles.actionBtnDisabled]}
              onPress={() => handleEnrichWord(item)}
              disabled={isEnriching}
            >
              {isEnriching ? (
                <ActivityIndicator size="small" color={colors.retroPurple} />
              ) : (
                <Text style={styles.actionBtnText}>✨</Text>
              )}
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleDelete(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="trash-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) return <Loading />;

  // Not logged in state
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedInContainer}>
          <View style={[styles.notLoggedInCard, dynamicStyles.notLoggedInCard]}>
            <View style={styles.notLoggedInAccent} />
            <View style={[styles.notLoggedInContent, dynamicStyles.notLoggedInContent]}>
              <Text style={[styles.notLoggedInEmoji, dynamicStyles.notLoggedInEmoji]}>📚</Text>
              <Text style={[styles.notLoggedInTitle, dynamicStyles.notLoggedInTitle]}>{t('vocabulary.title')}</Text>
              <View style={[styles.notLoggedInDivider, dynamicStyles.notLoggedInDivider]} />
              <Icon
                name="lock-closed"
                size={dynamicStyles.notLoggedInIcon.size}
                color={colors.retroPurple}
                style={{ marginBottom: dynamicStyles.notLoggedInIcon.marginBottom }}
              />
              <Text style={[styles.notLoggedInMessage, dynamicStyles.notLoggedInMessage]}>{t('profile.loginRequired')}</Text>
              <Text style={[styles.notLoggedInHint, dynamicStyles.notLoggedInHint]}>{t('vocabulary.noWordsMessage')}</Text>
            </View>
          </View>

          <View style={[styles.notLoggedInFeatures, dynamicStyles.notLoggedInFeatures]}>
            <View style={[styles.featureItem, dynamicStyles.featureItem]}>
              <Text style={[styles.featureIcon, dynamicStyles.featureIcon]}>✨</Text>
              <Text style={[styles.featureText, dynamicStyles.featureText]}>{t('vocabulary.filterNew')}</Text>
            </View>
            <View style={[styles.featureItem, dynamicStyles.featureItem]}>
              <Text style={[styles.featureIcon, dynamicStyles.featureIcon]}>📖</Text>
              <Text style={[styles.featureText, dynamicStyles.featureText]}>{t('vocabulary.filterLearning')}</Text>
            </View>
            <View style={[styles.featureItem, dynamicStyles.featureItem]}>
              <Text style={[styles.featureIcon, dynamicStyles.featureIcon]}>🎯</Text>
              <Text style={[styles.featureText, dynamicStyles.featureText]}>{t('vocabulary.flashcard')}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Card - Compact */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>📚 {t('vocabulary.title')}</Text>
          <Text style={styles.headerSubtitle}>{stats.total} từ</Text>
          <View style={styles.headerActions}>
            {vocabulary.length >= 2 && (
              <TouchableOpacity
                style={[styles.learnBtn, pendingReview.length > 0 && styles.learnBtnUrgent]}
                onPress={() => setShowLearn(true)}
              >
                <Text style={styles.learnBtnText}>
                  📝 {pendingReview.length > 0 ? `Ôn ${pendingReview.length}` : 'Ôn'}
                </Text>
              </TouchableOpacity>
            )}
            {vocabulary.length > 0 && (
              <TouchableOpacity
                style={styles.flashcardBtn}
                onPress={() => setShowFlashcard(true)}
              >
                <Icon name="albums" size={14} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Icon name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mode Toggle: Words vs Sentences */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'words' && styles.modeBtnActive]}
            onPress={() => setViewMode('words')}
          >
            <Text style={[styles.modeBtnText, viewMode === 'words' && styles.modeBtnTextActive]}>
              📚 Từ vựng
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'sentences' && styles.modeBtnActive]}
            onPress={() => setViewMode('sentences')}
          >
            <Text style={[styles.modeBtnText, viewMode === 'sentences' && styles.modeBtnTextActive]}>
              📌 Câu ({savedSentences.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Only show search + filter for word mode */}
        {viewMode === 'words' && (
          <>
            <View style={styles.searchBox}>
              <Icon name="search" size={14} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('vocabulary.searchPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="close-circle" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.filterRow}>
              {([
                { key: 'all' as WordStatus, label: 'Tất cả', count: stats.total },
                { key: 'new' as WordStatus, label: 'Mới', count: stats.new },
                { key: 'learning' as WordStatus, label: 'Học', count: stats.learning },
                { key: 'mastered' as WordStatus, label: 'Thuộc', count: stats.mastered },
              ]).map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.filterChip, activeFilter === tab.key && styles.filterChipActive]}
                  onPress={() => setActiveFilter(tab.key)}
                >
                  <Text style={[styles.filterChipText, activeFilter === tab.key && styles.filterChipTextActive]}>
                    {tab.label} {tab.count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>


      {/* Review Reminder - only in words mode */}
      {viewMode === 'words' && pendingReview.length > 0 && (
        <TouchableOpacity style={styles.reviewReminder} onPress={() => setShowLearn(true)}>
          <Text style={styles.reviewReminderIcon}>⏰</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewReminderTitle}>{pendingReview.length} từ cần ôn hôm nay</Text>
          </View>
          <Text style={styles.reviewReminderBtn}>Ôn ngay →</Text>
        </TouchableOpacity>
      )}

      {/* Saved Sentences View */}
      {viewMode === 'sentences' ? (
        savedSentences.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📌</Text>
            <Text style={styles.emptyTitle}>Chưa có câu nào được lưu</Text>
            <Text style={styles.emptyText}>
              Giữ lâu vào câu trong bài học để lưu lại{"\n"}những câu tiếng Đức hay.
            </Text>
          </View>
        ) : (
          <FlatList
            data={savedSentences}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleSentenceNavigate(item)}
                style={styles.sentenceCard}
              >
                <View style={styles.sentenceCardAccent} />
                <View style={styles.sentenceCardBody}>
                  <View style={styles.sentenceHeader}>
                    <Text style={styles.sentenceIndex}>{index + 1}</Text>
                    <TouchableOpacity
                      style={styles.speakBtn}
                      onPress={() => handleSpeakSentence(item.text)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="volume-high" size={16} color={colors.retroCyan} />
                    </TouchableOpacity>
                    <Text style={styles.sentenceText} numberOfLines={3}>{item.text}</Text>
                  </View>
                  {item.translation && (
                    <Text style={styles.sentenceTranslation}>{item.translation}</Text>
                  )}
                  <View style={styles.sentenceFooter}>
                    {item.lessonTitle ? (
                      <TouchableOpacity
                        style={styles.sourceTag}
                        onPress={() => handleSentenceNavigate(item)}
                      >
                        <Icon name="musical-notes-outline" size={11} color={colors.retroPurple} />
                        <Text style={[styles.sourceText, { textDecorationLine: 'underline' }]} numberOfLines={1}>{item.lessonTitle}</Text>
                      </TouchableOpacity>
                    ) : <View />}
                    <TouchableOpacity
                      style={styles.sentenceDeleteBtn}
                      onPress={() => handleDeleteSentence(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="trash-outline" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.retroCyan}
              />
            }
          />
        )
      ) : (
        <>
          {/* Word List */}
          {filteredVocabulary.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>
                {searchQuery ? '🔍' : activeFilter === 'new' ? '🆕' : activeFilter === 'learning' ? '📖' : activeFilter === 'mastered' ? '✅' : '📚'}
              </Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? t('vocabulary.notFound') : t('vocabulary.noWords')}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? t('vocabulary.tryOtherKeyword')
                  : t('vocabulary.noWordsMessage')}
              </Text>
              {!searchQuery && (
                <TouchableOpacity style={styles.addFirstBtn} onPress={() => setShowAddModal(true)}>
                  <Text style={styles.addFirstBtnText}>+ Thêm từ đầu tiên</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <FlatList
                data={paginatedVocabulary}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.retroCyan}
                  />
                }
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                    onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <Icon name="chevron-back" size={18} color={currentPage === 1 ? colors.textMuted : colors.retroDark} />
                  </TouchableOpacity>

                  <View style={styles.pageInfo}>
                    <Text style={styles.pageText}>{currentPage} / {totalPages}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                    onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <Icon name="chevron-forward" size={18} color={currentPage === totalPages ? colors.textMuted : colors.retroDark} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </>
      )}

      {/* Flashcard Modal */}
      <Modal
        visible={showFlashcard}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <FlashcardMode
          vocabulary={vocabulary}
          onClose={() => setShowFlashcard(false)}
          onUpdateCard={handleUpdateCard}
        />
      </Modal>

      {/* Add Word Modal */}
      <AddWordModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onWordAdded={handleWordAdded}
        pendingReviewCount={pendingReview.length}
      />

      {/* Learn Mode Modal */}
      <LearnMode
        visible={showLearn}
        vocabulary={vocabulary}
        onClose={() => setShowLearn(false)}
        onUpdateVocabulary={handleLearnUpdate}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  // Header Card - Compact
  headerCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: 10,
    backgroundColor: colors.retroCream,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.retroBorder,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: colors.retroYellow,
    borderColor: colors.retroBorder,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeBtnTextActive: {
    color: colors.retroDark,
    fontWeight: '700',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.retroDark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 'auto',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  learnBtn: {
    backgroundColor: colors.retroYellow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.retroBorder,
  },
  learnBtnUrgent: {
    backgroundColor: colors.retroCoral,
  },
  learnBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.retroDark,
  },
  flashcardBtn: {
    backgroundColor: colors.retroPurple,
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: colors.retroCyan,
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.retroBorder,
    height: 32,
    gap: 6,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.retroDark,
    padding: 0,
  },
  // Filter Tabs
  filterRow: {
    flexDirection: 'row',
    gap: 5,
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.retroBorder,
  },
  filterChipActive: {
    backgroundColor: colors.retroCyan,
    borderColor: colors.retroCyan,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  // Review Reminder
  reviewReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFB74D',
    gap: 8,
  },
  reviewReminderIcon: {
    fontSize: 20,
  },
  reviewReminderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E65100',
  },
  reviewReminderBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.retroCyan,
  },
  // Word List
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  wordCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
  },
  cardAccent: {
    width: 5,
  },
  cardBody: {
    flex: 1,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  wordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
    flexWrap: 'wrap',
  },
  wordIndex: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    minWidth: 18,
  },
  word: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.retroDark,
  },
  wordGender: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.retroPurple,
  },
  wordSeparator: {
    fontSize: 14,
    color: colors.textMuted,
    marginHorizontal: 2,
  },
  translation: {
    fontSize: 14,
    color: colors.retroPurple,
    fontWeight: '500',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  statusIcon: {
    fontSize: 10,
  },
  speakBtn: {
    padding: 2,
  },
  // Extended details
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  detailIPA: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  detailTag: {
    fontSize: 11,
    color: colors.textSecondary,
    backgroundColor: colors.retroCream,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  posBadge: {
    backgroundColor: colors.retroPurple + '15',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  posText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.retroPurple,
  },
  detailBaseForm: {
    fontSize: 11,
    color: colors.retroCyan,
    fontWeight: '500',
    marginBottom: 2,
  },
  detailGrammar: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
    lineHeight: 15,
  },
  context: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
    lineHeight: 16,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  sourceText: {
    fontSize: 10,
    color: colors.retroPurple,
    fontWeight: '500',
    maxWidth: '50%',
  },
  // Actions row
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.retroBorder + '30',
    paddingTop: 6,
    marginTop: 2,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.retroCream,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    fontSize: 14,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.retroDark,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  addFirstBtn: {
    backgroundColor: colors.retroCyan,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  addFirstBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  // Pagination
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.retroBorder,
    backgroundColor: colors.retroCream,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  pageText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.retroDark,
  },
  // Not Logged In State
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  notLoggedInCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 5,
  },
  notLoggedInAccent: {
    height: 6,
    backgroundColor: colors.retroPurple,
  },
  notLoggedInContent: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  notLoggedInEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  notLoggedInTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.retroDark,
    marginBottom: 16,
  },
  notLoggedInDivider: {
    width: 60,
    height: 3,
    backgroundColor: colors.retroYellow,
    borderRadius: 2,
    marginBottom: 20,
  },
  notLoggedInMessage: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.retroDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  notLoggedInHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  notLoggedInFeatures: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24,
  },
  featureItem: {
    alignItems: 'center',
    backgroundColor: colors.retroCream,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.retroDark,
  },
  deleteBtn: {
    padding: 4,
  },
  // Saved Sentence Cards
  sentenceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FFB74D',
    overflow: 'hidden',
  },
  sentenceCardAccent: {
    width: 5,
    backgroundColor: '#FFB74D',
  },
  sentenceCardBody: {
    flex: 1,
    padding: 12,
  },
  sentenceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  sentenceIndex: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    minWidth: 18,
    marginTop: 4,
  },
  sentenceText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.retroDark,
    lineHeight: 22,
  },
  sentenceTranslation: {
    fontSize: 13,
    color: colors.retroPurple,
    fontStyle: 'italic',
    marginTop: 4,
    marginLeft: 24,
    lineHeight: 18,
  },
  sentenceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.retroBorder + '30',
  },
  sentenceDeleteBtn: {
    padding: 4,
  },
});

export default VocabularyScreen;
