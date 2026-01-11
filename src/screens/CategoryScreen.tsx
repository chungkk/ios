// CategoryScreen - Shows all lessons in a specific category
// Neo-Retro Design

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useLessons } from '../hooks/useLessons';
import { lessonService } from '../services/lesson.service';
import LessonCard from '../components/lesson/LessonCard';
import ModeSelectionPopup, { LessonMode } from '../components/lesson/ModeSelectionPopup';
import { Loading } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { colors, spacing } from '../styles/theme';
import type { HomeStackScreenProps } from '../navigation/types';
import type { Lesson } from '../types/lesson.types';

type CategoryScreenProps = HomeStackScreenProps<'Category'>;

export const CategoryScreen: React.FC<CategoryScreenProps> = ({ route, navigation }) => {
  const { categorySlug = '', categoryName = '' } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showModePopup, setShowModePopup] = useState(false);
  
  const { lessons, loading, refetch } = useLessons({
    category: categorySlug || undefined,
    limit: 100,
  });

  const handleLessonPress = useCallback((lesson: Lesson) => {
    lessonService.incrementViewCount(lesson.id).catch(() => {});
    setSelectedLesson(lesson);
    setShowModePopup(true);
  }, []);

  const handleModeSelect = useCallback((mode: LessonMode) => {
    if (!selectedLesson) return;
    
    setShowModePopup(false);
    setSelectedLesson(null);
    
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

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (loading && !refreshing) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Neo-Retro Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="chevron-back" size={18} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{categoryName}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{lessons.length} bài</Text>
          </View>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {lessons.length === 0 ? (
        <EmptyState
          icon="book"
          title="Chưa có bài học"
          message={`Danh mục ${categoryName} chưa có bài học nào.`}
          actionLabel="Quay lại"
          onAction={handleBack}
        />
      ) : (
        <FlatList
          data={lessons}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <LessonCard
                lesson={item}
                onPress={() => handleLessonPress(item)}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.retroCyan}
            />
          }
          numColumns={2}
          columnWrapperStyle={styles.row}
        />
      )}

      {/* Mode Selection Popup */}
      <ModeSelectionPopup
        visible={showModePopup}
        lesson={selectedLesson}
        onClose={handleClosePopup}
        onSelectMode={handleModeSelect}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  // Neo-Retro Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.retroCream,
    borderBottomWidth: 3,
    borderBottomColor: colors.retroBorder,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.retroCyan,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  backText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.retroDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: colors.retroYellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.retroDark,
  },
  headerRight: {
    width: 70,
  },
  listContent: {
    padding: spacing.sm,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    flex: 0.48,
    marginBottom: spacing.sm,
  },
});

export default CategoryScreen;
