// ReadingListScreen - Professional news reading list
// Smart filters: only show levels with articles + article count

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { nachrichtService } from '../services/nachricht.service';
import { Loading } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { colors, spacing } from '../styles/theme';
import type { ReadStackScreenProps } from '../navigation/types';
import type { Nachricht } from '../types/lesson.types';

type Props = ReadStackScreenProps<'ReadingList'>;

const LEVEL_COLORS: Record<string, string> = {
  A1: '#4ECDC4',
  A2: '#7FDBDA',
  B1: '#F4B942',
  B2: '#FF6B6B',
  C1: '#FF8ED4',
  C2: '#A855F7',
};

const LEVEL_BG: Record<string, string> = {
  A1: 'rgba(78, 205, 196, 0.12)',
  A2: 'rgba(127, 219, 218, 0.12)',
  B1: 'rgba(244, 185, 66, 0.12)',
  B2: 'rgba(255, 107, 107, 0.12)',
  C1: 'rgba(255, 142, 212, 0.12)',
  C2: 'rgba(168, 85, 247, 0.12)',
};

const SOURCE_LABELS: Record<string, string> = {
  dw: 'Deutsche Welle',
  tagesschau: 'Tagesschau',
  manual: 'PapaGeil',
};

const SOURCE_ICONS: Record<string, string> = {
  dw: '🇩🇪',
  tagesschau: '📺',
  manual: '✍️',
};

// Estimate reading time - content may not be available in list view
const estimateReadTime = (item: Nachricht): number => {
  if (item.content) {
    const words = item.content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 150));
  }
  // Fallback: estimate from summary or vocab count
  const vocabCount = item.vocabularyWords?.length || 0;
  if (vocabCount > 15) return 5;
  if (vocabCount > 8) return 3;
  return 2;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
};

const ReadingListScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const [nachrichten, setNachrichten] = useState<Nachricht[]>([]);
  const [allNachrichten, setAllNachrichten] = useState<Nachricht[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);

      const data = await nachrichtService.fetchNachrichten(levelFilter || undefined, pageNum);

      if (refresh || pageNum === 1) {
        setNachrichten(data.nachrichten);
      } else {
        setNachrichten(prev => [...prev, ...data.nachrichten]);
      }

      // Also fetch all (unfiltered) for smart filter counts on first load
      if (pageNum === 1 && !levelFilter) {
        setAllNachrichten(data.nachrichten);
      }

      setHasMore(pageNum < data.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('[ReadingList] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [levelFilter]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  // Fetch unfiltered data for smart filter counts
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await nachrichtService.fetchNachrichten(undefined, 1, 100);
        setAllNachrichten(data.nachrichten);
      } catch {}
    };
    fetchAll();
  }, []);

  const handleRefresh = () => fetchData(1, true);
  const handleLoadMore = () => {
    if (hasMore && !loading) fetchData(page + 1);
  };

  // Smart filter: count articles per level
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allNachrichten.forEach(n => {
      const lvl = n.level?.toUpperCase();
      if (lvl) counts[lvl] = (counts[lvl] || 0) + 1;
    });
    return counts;
  }, [allNachrichten]);

  // Only show levels that have articles
  const availableLevels = useMemo(() => {
    return ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].filter(l => (levelCounts[l] || 0) > 0);
  }, [levelCounts]);

  const totalArticles = allNachrichten.length;

  const renderNachricht = ({ item, index }: { item: Nachricht; index: number }) => {
    const readTime = estimateReadTime(item);
    const vocabCount = item.vocabularyWords?.length || 0;
    const levelColor = LEVEL_COLORS[item.level?.toUpperCase()] || colors.retroCyan;
    const levelBg = LEVEL_BG[item.level?.toUpperCase()] || 'rgba(78, 205, 196, 0.1)';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('ReadingDetail', { nachrichtId: item._id })}
      >
        {/* Left accent stripe */}
        <View style={[styles.cardAccent, { backgroundColor: levelColor }]} />

        <View style={styles.cardBody}>
          {/* Top row: source + date */}
          <View style={styles.cardTopRow}>
            <View style={styles.sourceRow}>
              <Text style={styles.sourceEmoji}>{SOURCE_ICONS[item.source] || '📄'}</Text>
              <Text style={styles.sourceLabel}>{SOURCE_LABELS[item.source] || item.source}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.publishedAt || item.createdAt)}</Text>
          </View>

          {/* Title */}
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

          {/* Summary */}
          {item.summary ? (
            <Text style={styles.cardSummary} numberOfLines={2}>{item.summary}</Text>
          ) : null}

          {/* Bottom row: level badge + stats */}
          <View style={styles.cardBottomRow}>
            <View style={[styles.levelPill, { backgroundColor: levelBg }]}>
              <View style={[styles.levelDot, { backgroundColor: levelColor }]} />
              <Text style={[styles.levelPillText, { color: levelColor }]}>{item.level}</Text>
            </View>

            <View style={styles.statsRow}>
              {vocabCount > 0 && (
                <View style={styles.statItem}>
                  <Icon name="book-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.statText}>{vocabCount}</Text>
                </View>
              )}
              <View style={styles.statItem}>
                <Icon name="time-outline" size={13} color={colors.textMuted} />
                <Text style={styles.statText}>{readTime} min</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="eye-outline" size={13} color={colors.textMuted} />
                <Text style={styles.statText}>{item.viewCount}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Thumbnail */}
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardThumb} />
        ) : null}
      </TouchableOpacity>
    );
  };

  if (loading && nachrichten.length === 0) return <Loading />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Đọc Nachricht</Text>
            <Text style={styles.headerSubtitle}>Luyện đọc với tin tức tiếng Đức</Text>
          </View>
          <View style={styles.articleCountBadge}>
            <Icon name="newspaper-outline" size={14} color={colors.retroPurple} />
            <Text style={styles.articleCountText}>{totalArticles}</Text>
          </View>
        </View>
      </View>

      {/* Smart Level Filter - horizontal scroll */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {/* All filter */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              !levelFilter && styles.filterChipActive,
            ]}
            onPress={() => setLevelFilter(null)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterText,
              !levelFilter && styles.filterTextActive,
            ]}>
              Tất cả
            </Text>
            {!levelFilter && (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>{totalArticles}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Level filters - only levels with articles */}
          {availableLevels.map(level => {
            const isActive = levelFilter === level;
            const count = levelCounts[level] || 0;
            const color = LEVEL_COLORS[level];

            return (
              <TouchableOpacity
                key={level}
                style={[
                  styles.filterChip,
                  isActive && { backgroundColor: color, borderColor: color },
                ]}
                onPress={() => setLevelFilter(isActive ? null : level)}
                activeOpacity={0.7}
              >
                {!isActive && (
                  <View style={[styles.filterDot, { backgroundColor: color }]} />
                )}
                <Text style={[
                  styles.filterText,
                  isActive && styles.filterTextActive,
                ]}>
                  {level}
                </Text>
                <View style={[
                  styles.filterCountBadge,
                  isActive && { backgroundColor: 'rgba(255,255,255,0.3)' },
                ]}>
                  <Text style={[
                    styles.filterCountText,
                    isActive && { color: '#fff' },
                  ]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Article List */}
      {nachrichten.length === 0 ? (
        <EmptyState
          title={levelFilter ? `Chưa có bài ${levelFilter}` : 'Chưa có bài viết'}
          message={levelFilter ? 'Thử chọn level khác nhé!' : 'Quay lại sau nhé!'}
        />
      ) : (
        <FlatList
          data={nachrichten}
          keyExtractor={(item) => item._id}
          renderItem={renderNachricht}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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

  // Header
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  articleCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(138, 92, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  articleCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.retroPurple,
  },

  // Filter
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  filterScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: colors.retroPurple,
    borderColor: colors.retroPurple,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterTextActive: {
    color: '#fff',
  },
  filterCountBadge: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  // List
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 2,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    paddingLeft: 12,
  },

  // Card top row
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceEmoji: {
    fontSize: 12,
  },
  sourceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },

  // Card content
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
  cardSummary: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },

  // Card bottom
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  levelPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // Thumbnail
  cardThumb: {
    width: 80,
    height: '100%',
    minHeight: 100,
  },
});

export default ReadingListScreen;
