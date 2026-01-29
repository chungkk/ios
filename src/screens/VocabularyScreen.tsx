// VocabularyScreen - Smart Vocabulary Learning
// Neo-Retro Design with SRS Integration

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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import { vocabularyService, VocabularyItem } from '../services/vocabulary.service';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/common/Loading';
import FlashcardMode from '../components/vocabulary/FlashcardMode';
import { SRSCard } from '../utils/srs';
import { colors, spacing } from '../styles/theme';

const ITEMS_PER_PAGE = 15;

// Word status types
type WordStatus = 'all' | 'new' | 'learning' | 'mastered';

// Helper function to classify word status based on SRS state
const getWordStatusFromSRS = (item: VocabularyItem): WordStatus => {
  // Use actual SRS state if available
  if (item.srsState) {
    switch (item.srsState) {
      case 'new':
        return 'new';
      case 'learning':
      case 'relearning':
        return 'learning';
      case 'review':
        return 'mastered';
      default:
        return 'new';
    }
  }
  // Fallback: classify based on creation time if no SRS state
  const now = new Date();
  const created = new Date(item.createdAt || Date.now());
  const age = now.getTime() - created.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  if (age < oneDay) return 'new';
  if (age < oneWeek) return 'learning';
  return 'mastered';
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
    // Not Logged In Card - scale up for iPad
    notLoggedInCard: {
      maxWidth: isIPad ? 520 : 320,
    },
    notLoggedInEmoji: {
      fontSize: isIPad ? 72 : 48,
      marginBottom: isIPad ? 16 : 8,
    },
    notLoggedInTitle: {
      fontSize: isIPad ? 32 : 22,
      marginBottom: isIPad ? 24 : 16,
    },
    notLoggedInDivider: {
      width: isIPad ? 80 : 60,
      height: isIPad ? 4 : 3,
      marginBottom: isIPad ? 28 : 20,
    },
    notLoggedInIcon: {
      size: isIPad ? 56 : 40,
      marginBottom: isIPad ? 16 : 12,
    },
    notLoggedInMessage: {
      fontSize: isIPad ? 22 : 16,
      marginBottom: isIPad ? 12 : 8,
    },
    notLoggedInHint: {
      fontSize: isIPad ? 18 : 14,
      lineHeight: isIPad ? 28 : 20,
    },
    notLoggedInContent: {
      padding: isIPad ? 40 : 24, // spacing.xl = 24
    },
    // Feature items - scale up for iPad
    notLoggedInFeatures: {
      gap: isIPad ? 28 : 16,
      marginTop: isIPad ? 36 : 24,
    },
    featureItem: {
      paddingVertical: isIPad ? 20 : 12,
      paddingHorizontal: isIPad ? 28 : 16,
      borderRadius: isIPad ? 16 : 12,
    },
    featureIcon: {
      fontSize: isIPad ? 36 : 24,
      marginBottom: isIPad ? 8 : 4,
    },
    featureText: {
      fontSize: isIPad ? 15 : 11,
    },
  }), [isIPad]);

  // State
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [activeFilter] = useState<WordStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize TTS on mount - ignore silent switch so TTS works in silent mode
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

  // Fetch vocabulary when screen is focused (fixes issue where new words don't appear)
  useFocusEffect(
    useCallback(() => {
      fetchVocabulary();
    }, [fetchVocabulary])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVocabulary();
    setRefreshing(false);
  }, [fetchVocabulary]);

  // Calculate stats using SRS-based classification
  const stats = useMemo(() => {
    const counts = { new: 0, learning: 0, mastered: 0 };
    vocabulary.forEach(v => {
      const status = getWordStatusFromSRS(v);
      if (status !== 'all') {
        counts[status]++;
      }
    });
    return {
      total: vocabulary.length,
      ...counts,
    };
  }, [vocabulary]);

  // Filter and search using SRS-based classification
  const filteredVocabulary = useMemo(() => {
    let filtered = vocabulary;

    // Filter by status using SRS state
    if (activeFilter !== 'all') {
      filtered = filtered.filter(v => getWordStatusFromSRS(v) === activeFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.word.toLowerCase().includes(query) ||
        v.translation.toLowerCase().includes(query)
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

  // Reset page when filter changes
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

  // Handle SRS card update from flashcard mode
  const handleUpdateCard = useCallback(async (card: SRSCard) => {
    try {
      // Update vocabulary with SRS state via API
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

      // Update local state
      setVocabulary(prev => prev.map(v =>
        v.id === card.id
          ? {
            ...v,
            srsState: card.state,
            srsEase: card.ease,
            srsInterval: card.interval,
            srsStepIndex: card.stepIndex,
            srsDue: card.due.toISOString(),
            srsReviews: card.reviews,
            srsLapses: card.lapses,
            srsLastReview: card.lastReview?.toISOString() ?? null,
          }
          : v
      ));
    } catch (error) {
      console.error('Failed to update SRS card:', error);
    }
  }, []);

  // Speak word using TTS
  const handleSpeak = useCallback(async (word: string) => {
    try {
      const cleanW = word.replace(/[.,!?;:"""''„-]/g, '').trim();
      if (!cleanW) return;

      // Ensure TTS is initialized
      await Tts.getInitStatus();

      // Stop any ongoing speech first (wrapped for iOS compatibility)
      try {
        Tts.stop();
      } catch {
        // Ignore stop() errors on iOS
      }

      // Set German language and speak
      await Tts.setDefaultLanguage('de-DE');
      await Tts.speak(cleanW);
    } catch (ttsError: any) {
      console.error('[VocabularyScreen] TTS Error:', ttsError?.message || ttsError);
    }
  }, []);

  // Render word card
  const renderItem = ({ item }: { item: VocabularyItem }) => {
    const status = getWordStatusFromSRS(item);
    const statusConfig: Record<WordStatus, { icon: string; color: string; label: string }> = {
      all: { icon: '📚', color: colors.retroPurple, label: t('vocabulary.filterAll') },
      new: { icon: '🆕', color: colors.retroCoral, label: t('vocabulary.filterNew') },
      learning: { icon: '📖', color: colors.retroYellow, label: t('vocabulary.filterLearning') },
      mastered: { icon: '✅', color: colors.retroCyan, label: t('vocabulary.filterMastered') },
    };
    const config = statusConfig[status] || statusConfig.new;

    return (
      <View style={styles.wordCard}>
        <View style={[styles.cardAccent, { backgroundColor: config.color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={styles.wordInfo}>
              <Text style={styles.word}>{item.word}</Text>
              <TouchableOpacity
                style={styles.speakBtn}
                onPress={() => handleSpeak(item.word)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="volume-high" size={16} color={colors.retroCyan} />
              </TouchableOpacity>
              <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
                <Text style={styles.statusIcon}>{config.icon}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="trash-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.translation}>{item.translation}</Text>

          {item.context && (
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
        </View>
      </View>
    );
  };

  if (loading) return <Loading />;

  // Not logged in state - Neo Retro Style
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
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>📚 {t('vocabulary.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('vocabulary.wordsSaved', { count: stats.total })}</Text>
          </View>
          {vocabulary.length > 0 && (
            <TouchableOpacity
              style={styles.flashcardBtn}
              onPress={() => setShowFlashcard(true)}
            >
              <Icon name="albums" size={18} color="#fff" />
              <Text style={styles.flashcardBtnText}>{t('vocabulary.study')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Icon name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('vocabulary.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

      </View>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  // Header Card
  headerCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.retroCream,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.retroDark,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  flashcardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.retroPurple,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    gap: 6,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 2,
  },
  flashcardBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.retroBorder,
    height: 40,
    gap: 8,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.retroDark,
    padding: 0,
  },
  // Filter Chips
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.retroBorder,
  },
  filterChipActive: {
    backgroundColor: colors.retroCyan,
    borderColor: colors.retroCyan,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
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
    gap: 8,
  },
  word: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.retroDark,
  },
  statusBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusIcon: {
    fontSize: 10,
  },
  deleteBtn: {
    padding: 4,
  },
  speakBtn: {
    padding: 4,
  },
  translation: {
    fontSize: 14,
    color: colors.retroPurple,
    fontWeight: '500',
    marginBottom: 4,
  },
  context: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 6,
    lineHeight: 16,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  sourceText: {
    fontSize: 10,
    color: colors.retroPurple,
    fontWeight: '500',
    maxWidth: '50%',
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
  // Not Logged In State - Neo Retro
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
  notLoggedInIcon: {
    marginBottom: 12,
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
});

export default VocabularyScreen;
