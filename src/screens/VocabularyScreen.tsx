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
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { vocabularyService, VocabularyItem } from '../services/vocabulary.service';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import FlashcardMode from '../components/vocabulary/FlashcardMode';
import { SRSCard } from '../utils/srs';
import { colors, spacing } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEMS_PER_PAGE = 15;

// Word status types
type WordStatus = 'all' | 'new' | 'learning' | 'mastered';

const VocabularyScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // State
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [activeFilter, setActiveFilter] = useState<WordStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVocabulary();
    setRefreshing(false);
  }, [fetchVocabulary]);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    return {
      total: vocabulary.length,
      new: vocabulary.filter(v => {
        const created = new Date(v.createdAt || Date.now());
        return now.getTime() - created.getTime() < oneDay;
      }).length,
      learning: vocabulary.filter(v => {
        const created = new Date(v.createdAt || Date.now());
        const age = now.getTime() - created.getTime();
        return age >= oneDay && age < oneWeek;
      }).length,
      mastered: vocabulary.filter(v => {
        const created = new Date(v.createdAt || Date.now());
        return now.getTime() - created.getTime() >= oneWeek;
      }).length,
    };
  }, [vocabulary]);

  // Filter and search
  const filteredVocabulary = useMemo(() => {
    let filtered = vocabulary;
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(v => {
        const created = new Date(v.createdAt || Date.now());
        const age = now.getTime() - created.getTime();

        switch (activeFilter) {
          case 'new':
            return age < oneDay;
          case 'learning':
            return age >= oneDay && age < oneWeek;
          case 'mastered':
            return age >= oneWeek;
          default:
            return true;
        }
      });
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

  // Get word status
  const getWordStatus = (item: VocabularyItem): WordStatus => {
    const now = new Date();
    const created = new Date(item.createdAt || Date.now());
    const age = now.getTime() - created.getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    if (age < oneDay) return 'new';
    if (age < oneWeek) return 'learning';
    return 'mastered';
  };

  // Render word card
  const renderItem = ({ item }: { item: VocabularyItem }) => {
    const status = getWordStatus(item);
    const statusConfig: Record<WordStatus, { icon: string; color: string; label: string }> = {
      all: { icon: '📚', color: colors.retroPurple, label: 'Tất cả' },
      new: { icon: '🆕', color: colors.retroCoral, label: 'Mới' },
      learning: { icon: '📖', color: colors.retroYellow, label: 'Đang học' },
      mastered: { icon: '✅', color: colors.retroCyan, label: 'Đã thuộc' },
    };
    const config = statusConfig[status] || statusConfig.new;

    return (
      <View style={styles.wordCard}>
        <View style={[styles.cardAccent, { backgroundColor: config.color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={styles.wordInfo}>
              <Text style={styles.word}>{item.word}</Text>
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

  // Filter tabs
  const filterTabs: { key: WordStatus; label: string; count: number }[] = [
    { key: 'all', label: t('vocabulary.filterAll'), count: stats.total },
    { key: 'new', label: t('vocabulary.filterNew'), count: stats.new },
    { key: 'learning', label: t('vocabulary.filterLearning'), count: stats.learning },
    { key: 'mastered', label: t('vocabulary.filterMastered'), count: stats.mastered },
  ];

  if (loading) return <Loading />;

  // Not logged in state - Neo Retro Style
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedInContainer}>
          <View style={styles.notLoggedInCard}>
            <View style={styles.notLoggedInAccent} />
            <View style={styles.notLoggedInContent}>
              <Text style={styles.notLoggedInEmoji}>📚</Text>
              <Text style={styles.notLoggedInTitle}>{t('vocabulary.title')}</Text>
              <View style={styles.notLoggedInDivider} />
              <Icon name="lock-closed" size={40} color={colors.retroPurple} style={styles.notLoggedInIcon} />
              <Text style={styles.notLoggedInMessage}>{t('profile.loginRequired')}</Text>
              <Text style={styles.notLoggedInHint}>{t('vocabulary.noWordsMessage')}</Text>
            </View>
          </View>

          <View style={styles.notLoggedInFeatures}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✨</Text>
              <Text style={styles.featureText}>{t('vocabulary.filterNew')}</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📖</Text>
              <Text style={styles.featureText}>{t('vocabulary.filterLearning')}</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureText}>{t('vocabulary.flashcard')}</Text>
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

        {/* Simple Filter Chips */}
        <View style={styles.filterRow}>
          {filterTabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterChip, activeFilter === tab.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text style={[styles.filterChipText, activeFilter === tab.key && styles.filterChipTextActive]}>
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
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
    margin: spacing.md,
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
    maxWidth: SCREEN_WIDTH * 0.5,
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
