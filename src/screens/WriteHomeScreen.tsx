// WriteHomeScreen - Chính tả tab with 3x4 grid layout + pagination
// Displays all local_audio lessons in a 3-column grid (12 items per page)

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useLessons } from '../hooks/useLessons';
import { lessonService } from '../services/lesson.service';
import { unlockService } from '../services/unlock.service';
import { homepageService } from '../services/homepage.service';
import DifficultyFilter from '../components/lesson/DifficultyFilter';
import UnlockModal from '../components/lesson/UnlockModal';
import { Loading } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { colors, spacing, shadows } from '../styles/theme';
import { BASE_URL } from '../services/api';
import type { Lesson } from '../types/lesson.types';
import type { UserUnlockInfo } from '../types/unlock.types';
import { getThumbnailUrl, formatDuration, getDifficultyLabel } from '../utils/youtube';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const COLUMNS = 3;
const ITEMS_PER_PAGE = 12; // 3x4
const CARD_GAP = 8;
const CONTAINER_PADDING = 10;
const CARD_WIDTH = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - CARD_GAP * (COLUMNS - 1)) / COLUMNS;

// ─── Mini Grid Card ───────────────────────────────────────────
interface GridCardProps {
  lesson: Lesson;
  onPress: () => void;
}

const GridCard: React.FC<GridCardProps> = React.memo(({ lesson, onPress }) => {
  const [imgError, setImgError] = useState(false);

  const thumbnail = !imgError && lesson.thumbnail
    ? (lesson.thumbnail.startsWith('/') ? `${BASE_URL}${lesson.thumbnail}` : lesson.thumbnail)
    : '';
  const hasThumb = thumbnail.length > 0;
  const diffLabel = getDifficultyLabel(lesson.level);
  const diffColor = getDifficultyColor(lesson.level);
  const isLocked = lesson.isLocked ?? false;

  return (
    <TouchableOpacity
      style={[gridStyles.card, isLocked && gridStyles.lockedCard]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Thumbnail */}
      <View style={gridStyles.thumbWrap}>
        {hasThumb ? (
          <Image
            source={{ uri: thumbnail }}
            style={[gridStyles.thumb, isLocked && { opacity: 0.5 }]}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={[gridStyles.thumb, gridStyles.placeholderThumb]}>
            <Icon name="headset-outline" size={24} color={colors.textSecondary} style={{ opacity: 0.5 }} />
          </View>
        )}

        {/* Lock overlay */}
        {isLocked && (
          <View style={gridStyles.lockOverlay}>
            <View style={gridStyles.lockBadge}>
              <Icon name="lock-closed" size={14} color={colors.retroDark} />
            </View>
          </View>
        )}

        {/* Level badge */}
        <View style={[gridStyles.levelBadge, { backgroundColor: diffColor }]}>
          <Text style={gridStyles.levelText}>{diffLabel}</Text>
        </View>

        {/* Duration */}
        {lesson.videoDuration > 0 && (
          <View style={gridStyles.durationBadge}>
            <Text style={gridStyles.durationText}>{formatDuration(lesson.videoDuration)}</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <View style={gridStyles.content}>
        <Text style={[gridStyles.title, isLocked && { color: colors.textSecondary }]} numberOfLines={2}>
          {lesson.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const getDifficultyColor = (level: string): string => {
  if (!level) return colors.retroCyan;
  const map: Record<string, string> = {
    a1: colors.retroCyan, a2: '#7FDBDA',
    b1: colors.retroYellow, b2: colors.retroCoral,
    c1: colors.retroPink, c2: colors.retroPurple,
  };
  return map[level.toLowerCase()] || colors.retroCyan;
};

const gridStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.retroBorder,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 0,
    elevation: 3,
  },
  lockedCard: {
    opacity: 0.8,
  },
  thumbWrap: {
    height: CARD_WIDTH * 0.65,
    position: 'relative',
    backgroundColor: '#E8E0D4',
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  placeholderThumb: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E0D4',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  lockBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.retroBorder,
  },
  levelBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.retroBorder,
  },
  levelText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.retroDark,
    textTransform: 'uppercase',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: colors.retroDark,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  durationText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
  },
  content: {
    padding: 6,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.retroDark,
    lineHeight: 13,
  },
});

// ─── Main Screen ──────────────────────────────────────────────
export const WriteHomeScreen: React.FC<any> = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, userPoints } = useAuth();

  const streakValue = typeof user?.streak === 'object' && user?.streak !== null
    ? (user.streak as any).currentStreak || 0
    : user?.streak || 0;

  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'experienced'>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Unlock state
  const [unlockLesson, setUnlockLesson] = useState<Lesson | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [userUnlockInfo, setUserUnlockInfo] = useState<UserUnlockInfo | null>(null);

  // Fetch all local_audio lessons
  const { lessons, loading, refetch } = useLessons({
    source: 'local_audio',
    difficulty: difficultyFilter === 'all' ? undefined : difficultyFilter,
    limit: 200,
  });

  // Fetch unlock info
  useFocusEffect(
    useCallback(() => {
      const fetchInfo = async () => {
        try {
          const data = await homepageService.fetchHomepageData('all', 1);
          setUserUnlockInfo(data.userUnlockInfo || null);
        } catch (e) { }
      };
      fetchInfo();
    }, []),
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(lessons.length / ITEMS_PER_PAGE));
  const paginatedLessons = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return lessons.slice(start, start + ITEMS_PER_PAGE);
  }, [lessons, currentPage]);

  // Reset page on filter change
  const handleFilterChange = useCallback((f: 'all' | 'beginner' | 'experienced') => {
    setDifficultyFilter(f);
    setCurrentPage(0);
  }, []);

  const handleLessonPress = useCallback((lesson: Lesson) => {
    if (lesson.isLocked) {
      setUnlockLesson(lesson);
      setShowUnlockModal(true);
      return;
    }
    lessonService.incrementViewCount(lesson.id).catch(() => { });
    navigation.navigate('Dictation', { lessonId: lesson.id });
  }, [navigation]);

  const handleUnlockConfirm = useCallback(async (lessonId: string) => {
    setIsUnlocking(true);
    try {
      const result = await unlockService.unlockLesson(lessonId);
      if (result.success) {
        setShowUnlockModal(false);
        setUnlockLesson(null);
        await refetch();
        const data = await homepageService.fetchHomepageData('all', 1);
        setUserUnlockInfo(data.userUnlockInfo || null);
      } else {
        throw new Error(result.error || 'Failed');
      }
    } catch (e: any) {
      console.error('[WriteHome] Unlock error:', e);
      throw e;
    } finally {
      setIsUnlocking(false);
    }
  }, [refetch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const goPage = useCallback((dir: number) => {
    setCurrentPage((p) => Math.max(0, Math.min(totalPages - 1, p + dir)));
  }, [totalPages]);

  if (loading && !refreshing && lessons.length === 0) {
    return <Loading />;
  }

  const renderItem = ({ item }: { item: Lesson }) => (
    <GridCard lesson={item} onPress={() => handleLessonPress(item)} />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Title bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Chính tả</Text>
      </View>

      <FlatList
        data={paginatedLessons}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.retroCyan}
          />
        }
        ListHeaderComponent={
          <>
            {/* Welcome header */}
            <View style={styles.header}>
              <View style={styles.welcomeRow}>
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
                <View style={styles.welcomeText}>
                  <Text style={styles.welcomeLabel}>{t('home.welcome')}</Text>
                  <Text style={styles.userName}>{user?.name || t('home.student')}</Text>
                </View>
                <View style={styles.statsContainer}>
                  <View style={styles.statBadge}>
                    <Icon name="diamond" size={14} color={colors.retroCyan} />
                    <Text style={styles.statValue}>{userPoints || 0}</Text>
                  </View>
                  <View style={[styles.statBadge, styles.streakBadge]}>
                    <Icon name="flame" size={14} color={colors.retroCoral} />
                    <Text style={styles.statValue}>{streakValue}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Difficulty filter */}
            <DifficultyFilter
              selected={difficultyFilter}
              onSelect={handleFilterChange}
            />

            {/* Lesson count */}
            <View style={styles.countRow}>
              <View style={styles.countLabelRow}>
                <Icon name="document-text" size={16} color={colors.retroCoral} />
                <Text style={styles.countLabel}>
                  {lessons.length} bài
                </Text>
              </View>
              {totalPages > 1 && (
                <Text style={styles.pageInfo}>
                  Trang {currentPage + 1}/{totalPages}
                </Text>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="headset"
            title={t('home.noLessons')}
            message={t('home.noLessonsMessage')}
            actionLabel={t('home.resetFilter')}
            onAction={() => handleFilterChange('all')}
          />
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.pagination}>
              {/* Previous */}
              <TouchableOpacity
                style={[styles.pageBtn, currentPage === 0 && styles.pageBtnDisabled]}
                onPress={() => goPage(-1)}
                disabled={currentPage === 0}
                activeOpacity={0.85}
              >
                <Icon name="chevron-back" size={16} color={currentPage === 0 ? colors.textMuted : '#fff'} />
                <Text style={[styles.pageBtnText, currentPage === 0 && styles.pageBtnTextDisabled]}>Trước</Text>
              </TouchableOpacity>

              {/* Page dots */}
              <View style={styles.pageDots}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.pageDot, i === currentPage && styles.pageDotActive]}
                    onPress={() => setCurrentPage(i)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pageDotText, i === currentPage && styles.pageDotTextActive]}>
                      {i + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Next */}
              <TouchableOpacity
                style={[styles.pageBtn, currentPage === totalPages - 1 && styles.pageBtnDisabled]}
                onPress={() => goPage(1)}
                disabled={currentPage === totalPages - 1}
                activeOpacity={0.85}
              >
                <Text style={[styles.pageBtnText, currentPage === totalPages - 1 && styles.pageBtnTextDisabled]}>Sau</Text>
                <Icon name="chevron-forward" size={16} color={currentPage === totalPages - 1 ? colors.textMuted : '#fff'} />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Unlock Modal */}
      <UnlockModal
        visible={showUnlockModal}
        lesson={unlockLesson}
        userUnlockInfo={userUnlockInfo}
        onConfirm={handleUnlockConfirm}
        onClose={() => { setShowUnlockModal(false); setUnlockLesson(null); }}
        isLoading={isUnlocking}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
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
  // Welcome
  header: {
    paddingHorizontal: CONTAINER_PADDING,
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
  streakBadge: {
    // slightly different tint for streak
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.retroDark,
  },
  // Count row
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: CONTAINER_PADDING,
    paddingBottom: 8,
  },
  countLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.retroCoral,
    textTransform: 'uppercase',
  },
  pageInfo: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  // Grid
  gridContent: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingBottom: 20,
  },
  row: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  // Pagination
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.retroPurple,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    gap: 4,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 2,
  },
  pageBtnDisabled: {
    backgroundColor: '#333',
    borderColor: '#555',
    shadowOpacity: 0,
  },
  pageBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  pageBtnTextDisabled: {
    color: colors.textMuted,
  },
  pageDots: {
    flexDirection: 'row',
    gap: 6,
  },
  pageDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.retroCream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  pageDotActive: {
    backgroundColor: colors.retroCyan,
  },
  pageDotText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.retroDark,
  },
  pageDotTextActive: {
    color: '#fff',
  },
});

export default WriteHomeScreen;
