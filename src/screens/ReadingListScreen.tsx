// ReadingListScreen - List of Nachrichten for reading practice

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Image,
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
  A1: colors.difficultyA1,
  A2: colors.difficultyA2,
  B1: colors.difficultyB1,
  B2: colors.difficultyB2,
  C1: colors.difficultyC1,
  C2: colors.difficultyC2,
};

const SOURCE_LABELS: Record<string, string> = {
  dw: 'Deutsche Welle',
  tagesschau: 'Tagesschau',
  manual: 'PapaGeil',
};

const ReadingListScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const [nachrichten, setNachrichten] = useState<Nachricht[]>([]);
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

  const handleRefresh = () => fetchData(1, true);
  const handleLoadMore = () => {
    if (hasMore && !loading) fetchData(page + 1);
  };

  const renderNachricht = ({ item }: { item: Nachricht }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ReadingDetail', { nachrichtId: item._id })}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImagePlaceholder, { backgroundColor: LEVEL_COLORS[item.level] || colors.retroCyan }]}>
          <Icon name="newspaper-outline" size={32} color="#fff" />
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardMeta}>
          <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[item.level] || colors.retroCyan }]}>
            <Text style={styles.levelText}>{item.level}</Text>
          </View>
          <Text style={styles.sourceText}>{SOURCE_LABELS[item.source] || item.source}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        {item.summary ? (
          <Text style={styles.cardSummary} numberOfLines={2}>{item.summary}</Text>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={styles.vocabCount}>
            <Icon name="book-outline" size={12} color={colors.textSecondary} />
            {' '}{item.vocabularyWords?.length || 0} từ vựng
          </Text>
          <Text style={styles.viewCount}>
            <Icon name="eye-outline" size={12} color={colors.textSecondary} />
            {' '}{item.viewCount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && nachrichten.length === 0) return <Loading />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đọc Nachricht</Text>
        <Text style={styles.headerSubtitle}>Luyện đọc với tin tức tiếng Đức</Text>
      </View>

      {/* Level Filter */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !levelFilter && styles.filterChipActive]}
          onPress={() => setLevelFilter(null)}
        >
          <Text style={[styles.filterText, !levelFilter && styles.filterTextActive]}>Tất cả</Text>
        </TouchableOpacity>
        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
          <TouchableOpacity
            key={level}
            style={[styles.filterChip, levelFilter === level && styles.filterChipActive]}
            onPress={() => setLevelFilter(levelFilter === level ? null : level)}
          >
            <Text style={[styles.filterText, levelFilter === level && styles.filterTextActive]}>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {nachrichten.length === 0 ? (
        <EmptyState title="Chưa có bài viết" message="Quay lại sau nhé!" />
      ) : (
        <FlatList
          data={nachrichten}
          keyExtractor={(item) => item._id}
          renderItem={renderNachricht}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  filterChipActive: {
    backgroundColor: colors.retroPurple,
    borderColor: colors.retroBorder,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: spacing.md,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
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
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: 4,
  },
  cardSummary: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vocabCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  viewCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default ReadingListScreen;
