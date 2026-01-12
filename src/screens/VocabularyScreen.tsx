// VocabularyScreen - My Vocabulary List
// Neo-Retro Design

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { vocabularyService, VocabularyItem } from '../services/vocabulary.service';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import FlashcardMode from '../components/vocabulary/FlashcardMode';
import { colors, spacing } from '../styles/theme';

const ITEMS_PER_PAGE = 10;

const VocabularyScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFlashcard, setShowFlashcard] = useState(false);

  const fetchVocabulary = useCallback(async () => {
    // Don't fetch if user is not logged in
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
    setCurrentPage(1);
    await fetchVocabulary();
    setRefreshing(false);
  }, [fetchVocabulary]);

  // Pagination calculations
  const totalPages = Math.ceil(vocabulary.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedVocabulary = vocabulary.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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

  const renderItem = ({ item }: { item: VocabularyItem }) => (
    <View style={styles.wordCard}>
      <View style={styles.cardTopBar} />
      <View style={styles.cardContent}>
        <View style={styles.wordHeader}>
          <Text style={styles.word}>{item.word}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <Icon name="trash-outline" size={18} color={colors.retroCoral} />
          </TouchableOpacity>
        </View>
        <Text style={styles.translation}>{item.translation}</Text>
        {item.context && (
          <Text style={styles.context} numberOfLines={2}>
            "{item.context}"
          </Text>
        )}
        {item.lessonTitle && (
          <View style={styles.lessonBadge}>
            <Icon name="book-outline" size={12} color={colors.retroPurple} />
            <Text style={styles.lessonTitle}>{item.lessonTitle}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>📚 {t('vocabulary.title')}</Text>
          <Text style={styles.wordCount}>{vocabulary.length} {t('vocabulary.words')}</Text>
        </View>
        {vocabulary.length > 0 && (
          <TouchableOpacity 
            style={styles.flashcardButton} 
            onPress={() => setShowFlashcard(true)}
          >
            <Icon name="albums-outline" size={18} color="#fff" />
            <Text style={styles.flashcardButtonText}>{t('vocabulary.flashcard')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {vocabulary.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title={t('vocabulary.noWords')}
          message={t('vocabulary.noWordsMessage')}
        />
      ) : (
        <>
          <FlatList
            data={paginatedVocabulary}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
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
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                onPress={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Icon name="chevron-back" size={20} color={currentPage === 1 ? colors.textMuted : colors.retroDark} />
              </TouchableOpacity>

              <View style={styles.pageNumbers}>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 5) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, index, arr) => (
                    <React.Fragment key={page}>
                      {index > 0 && arr[index - 1] !== page - 1 && (
                        <Text style={styles.ellipsis}>...</Text>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.pageNumber,
                          currentPage === page && styles.pageNumberActive,
                        ]}
                        onPress={() => goToPage(page)}
                      >
                        <Text
                          style={[
                            styles.pageNumberText,
                            currentPage === page && styles.pageNumberTextActive,
                          ]}
                        >
                          {page}
                        </Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
              </View>

              <TouchableOpacity
                style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                onPress={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Icon name="chevron-forward" size={20} color={currentPage === totalPages ? colors.textMuted : colors.retroDark} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.retroDark,
  },
  wordCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  flashcardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.retroPurple,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  flashcardButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  list: {
    padding: spacing.md,
    paddingBottom: 20,
  },
  wordCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 3,
  },
  cardTopBar: {
    height: 4,
    backgroundColor: colors.retroCyan,
  },
  cardContent: {
    padding: 14,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  word: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.retroDark,
  },
  deleteButton: {
    padding: 6,
  },
  translation: {
    fontSize: 15,
    color: colors.retroPurple,
    fontWeight: '500',
    marginBottom: 8,
  },
  context: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 18,
  },
  lessonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.retroCream,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.retroBorder,
  },
  lessonTitle: {
    fontSize: 11,
    color: colors.retroPurple,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.retroCream,
    borderTopWidth: 3,
    borderTopColor: colors.retroBorder,
    gap: spacing.sm,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pageNumber: {
    minWidth: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  pageNumberActive: {
    backgroundColor: colors.retroCyan,
    borderColor: colors.retroBorder,
  },
  pageNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.retroDark,
  },
  pageNumberTextActive: {
    color: colors.retroDark,
  },
  ellipsis: {
    fontSize: 14,
    color: colors.textMuted,
    paddingHorizontal: 4,
  },
});

export default VocabularyScreen;
