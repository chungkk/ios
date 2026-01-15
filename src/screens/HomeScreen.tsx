// HomeScreen - Browse lessons by category with difficulty filter
// Migrated from ppgeil/pages/index.js - uses optimized homepage-data API

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useHomepageData } from '../hooks/useHomepageData';
import { useAuth } from '../hooks/useAuth';
import { lessonService } from '../services/lesson.service';
import { unlockService } from '../services/unlock.service';
import LessonCard from '../components/lesson/LessonCard';
import DifficultyFilter from '../components/lesson/DifficultyFilter';
import ModeSelectionPopup, { LessonMode } from '../components/lesson/ModeSelectionPopup';
import UnlockModal from '../components/lesson/UnlockModal';
import { Loading, SkeletonCard } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { colors, spacing } from '../styles/theme';
import type { HomeStackScreenProps } from '../navigation/types';
import type { Lesson } from '../types/lesson.types';
import { BASE_URL } from '../services/api';

type HomeScreenProps = HomeStackScreenProps<'HomeScreen'>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'experienced'>('beginner');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showModePopup, setShowModePopup] = useState(false);
  const [isFilterChanging, setIsFilterChanging] = useState(false);

  // Unlock modal state
  const [unlockLesson, setUnlockLesson] = useState<Lesson | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Get user data
  const { user, userPoints } = useAuth();

  // Get streak value safely
  const streakValue = typeof user?.streak === 'object' && user?.streak !== null
    ? (user.streak as any).currentStreak || 0
    : user?.streak || 0;

  // Use optimized single API call instead of separate calls
  const { categories, categoriesWithLessons, userUnlockInfo, loading, refetch } = useHomepageData(difficultyFilter, 6);

  // Handle filter change with smooth transition
  const handleFilterChange = useCallback((filter: 'all' | 'beginner' | 'experienced') => {
    setIsFilterChanging(true);
    setDifficultyFilter(filter);
    // Reset filter changing state after data loads
    setTimeout(() => setIsFilterChanging(false), 300);
  }, []);

  const handleLessonPress = useCallback((lesson: Lesson) => {
    // Check if lesson is locked
    if (lesson.isLocked) {
      // Show unlock modal instead of mode selection
      setUnlockLesson(lesson);
      setShowUnlockModal(true);
      return;
    }

    // Increment view count (non-blocking)
    lessonService.incrementViewCount(lesson.id).catch(() => { });
    // Show mode selection popup
    setSelectedLesson(lesson);
    setShowModePopup(true);
  }, []);

  // Handle unlock confirmation
  const handleUnlockConfirm = useCallback(async (lessonId: string) => {
    setIsUnlocking(true);
    try {
      const result = await unlockService.unlockLesson(lessonId);

      if (result.success) {
        // Close modal and refresh data
        setShowUnlockModal(false);
        setUnlockLesson(null);
        await refetch();

        // After successful unlock, show mode selection
        // Find the lesson and open mode popup
        const unlockedLesson = { ...unlockLesson!, isLocked: false };
        setSelectedLesson(unlockedLesson);
        setShowModePopup(true);
      } else {
        throw new Error(result.error || 'Failed to unlock');
      }
    } catch (error: any) {
      console.error('[HomeScreen] Unlock error:', error);
      throw error;
    } finally {
      setIsUnlocking(false);
    }
  }, [refetch, unlockLesson]);

  const handleCloseUnlockModal = useCallback(() => {
    setShowUnlockModal(false);
    setUnlockLesson(null);
  }, []);

  const handleModeSelect = useCallback((mode: LessonMode) => {
    if (!selectedLesson) return;

    setShowModePopup(false);
    setSelectedLesson(null);

    // Navigate based on mode
    if (mode === 'dictation') {
      navigation.navigate('Dictation', { lessonId: selectedLesson.id });
    } else {
      navigation.navigate('Lesson', { lessonId: selectedLesson.id });
    }
  }, [selectedLesson, navigation]);

  const handleClosePopup = useCallback(() => {
    setShowModePopup(false);
    setSelectedLesson(null);
  }, []);

  const handleViewAll = useCallback((categorySlug: string, categoryName: string) => {
    navigation.navigate('Category', { categorySlug, categoryName });
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Only show full loading on initial load (when no data yet)
  const isInitialLoading = loading && !refreshing && categories.length === 0;

  if (isInitialLoading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>{t('home.learning')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.retroCyan}
          />
        }
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <View style={styles.welcomeRow}>
            {/* Avatar */}
            {user?.picture ? (
              <Image
                source={{ uri: user.picture.startsWith('/') ? `${BASE_URL}${user.picture}` : user.picture }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            {/* Welcome Text */}
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeLabel}>{t('home.welcome')}</Text>
              <Text style={styles.userName}>{user?.name || t('home.student')}</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statBadge}>
                <Text style={styles.statIcon}>💎</Text>
                <Text style={styles.statValue}>{userPoints || 0}</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statIcon}>🔥</Text>
                <Text style={styles.statValue}>{streakValue}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Difficulty Filter */}
        <DifficultyFilter
          selected={difficultyFilter}
          onSelect={handleFilterChange}
        />

        {/* Categories with Lessons */}
        {(loading || isFilterChanging) && categories.length > 0 ? (
          // Show skeleton placeholders when filter is changing (but we have old data)
          <>
            {[1, 2].map((i) => (
              <View key={`skeleton-section-${i}`} style={[styles.categorySection, { opacity: 0.6 }]}>
                <View style={styles.categoryHeader}>
                  <View style={{ width: 150, height: 16, backgroundColor: colors.retroBorder, borderRadius: 4 }} />
                </View>
                <FlatList
                  horizontal
                  data={[1, 2, 3]}
                  renderItem={() => <SkeletonCard style={styles.skeletonCard} />}
                  keyExtractor={(item) => `skeleton-${i}-${item}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                />
              </View>
            ))}
          </>
        ) : categories.length === 0 ? (
          <EmptyState
            icon="book"
            title={t('home.noLessons')}
            message={t('home.noLessonsMessage')}
            actionLabel={t('home.resetFilter')}
            onAction={() => setDifficultyFilter('all')}
          />
        ) : (
          categories.map((category) => {
            const categoryData = categoriesWithLessons[category.slug];
            if (!categoryData || categoryData.lessons.length === 0) return null;

            return (
              <View key={category.slug} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>
                    {category.name} ({categoryData.totalCount} {t('home.lessons')})
                  </Text>
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => handleViewAll(category.slug, category.name)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.viewAllButtonText}>{t('home.viewAll')} ›</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  horizontal
                  data={categoryData.lessons}
                  renderItem={({ item }) => (
                    <LessonCard
                      lesson={item}
                      onPress={() => handleLessonPress(item)}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                />
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Mode Selection Popup */}
      <ModeSelectionPopup
        visible={showModePopup}
        lesson={selectedLesson}
        onClose={handleClosePopup}
        onSelectMode={handleModeSelect}
      />

      {/* Unlock Modal */}
      <UnlockModal
        visible={showUnlockModal}
        lesson={unlockLesson}
        userUnlockInfo={userUnlockInfo}
        onConfirm={handleUnlockConfirm}
        onClose={handleCloseUnlockModal}
        isLoading={isUnlocking}
      />
    </SafeAreaView>
  );
};

// Neo-Retro Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgPrimary,
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textLight,
  },
  // Welcome Header
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.retroCream,
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: colors.retroCyan,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.retroCyan,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.retroBorder,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  welcomeText: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.retroDark,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.retroCream,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    gap: 6,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 2,
  },
  statIcon: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.retroDark,
  },
  // Neo-Retro Category Section - Compact
  categorySection: {
    marginBottom: 16,
    marginHorizontal: spacing.sm,
    padding: 14,
    backgroundColor: colors.retroCream,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    borderRadius: 16,
    // Neo-retro offset shadow
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.retroPurple,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  viewAllButton: {
    backgroundColor: colors.retroPurple,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    // Small shadow
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 2,
  },
  viewAllButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  horizontalList: {
    paddingHorizontal: 2,
  },
  skeletonCard: {
    width: 180,
    marginRight: spacing.sm,
  },
});

export default HomeScreen;
