// CategoryScreen - Shows all lessons in a specific category
// Migrated from ppgeil/pages/category/[slug].js

import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useLessons } from '../hooks/useLessons';
import LessonCard from '../components/lesson/LessonCard';
import { Loading } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { colors, spacing } from '../styles/theme';
import { textStyles } from '../styles/typography';
import type { HomeStackScreenProps } from '../navigation/types';

type CategoryScreenProps = HomeStackScreenProps<'Category'>;

export const CategoryScreen: React.FC<CategoryScreenProps> = ({ route, navigation }) => {
  const { categorySlug, categoryName } = route.params;
  
  const { lessons, loading, refetch } = useLessons({
    category: categorySlug,
    limit: 100,
  });

  const handleLessonPress = (lessonId: string) => {
    // TODO: Navigate to LessonScreen (Phase 4)
    console.log('Navigate to lesson:', lessonId);
    // navigation.navigate('Lesson', { lessonId });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{categoryName}</Text>
        <Text style={styles.subtitle}>{lessons.length} lessons</Text>
      </View>

      {lessons.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No lessons yet"
          message={`There are no lessons in ${categoryName} category yet.`}
          actionLabel="Go Back"
          onAction={handleBack}
        />
      ) : (
        <FlatList
          data={lessons}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <LessonCard
                lesson={item}
                onPress={() => handleLessonPress(item.id)}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  title: {
    ...textStyles.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  listContent: {
    padding: spacing.md,
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
});

export default CategoryScreen;
