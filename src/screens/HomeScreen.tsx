// HomeScreen - Browse lessons by category with difficulty filter
// Migrated from ppgeil/pages/index.js

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useLessons } from '../hooks/useLessons';
import { useCategories } from '../hooks/useCategories';
import LessonCard from '../components/lesson/LessonCard';
import DifficultyFilter from '../components/lesson/DifficultyFilter';
import { Loading, SkeletonCard } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { colors, spacing } from '../styles/theme';
import { textStyles } from '../styles/typography';
import type { HomeStackScreenProps } from '../navigation/types';

type HomeScreenProps = HomeStackScreenProps<'HomeScreen'>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'experienced'>('beginner');
  
  const { categories, loading: categoriesLoading } = useCategories();
  const { lessons, loading: lessonsLoading } = useLessons({ difficulty: difficultyFilter, limit: 6 });

  const handleLessonPress = (lessonId: string) => {
    // Navigate to LessonScreen
    navigation.navigate('Lesson', { lessonId });
  };

  const handleViewAll = (categorySlug: string, _categoryName: string) => {
    // Navigate to CategoryScreen
    console.log('Navigate to category:', categorySlug);
    // navigation.navigate('Category', { categorySlug, categoryName: _categoryName });
  };

  if (categoriesLoading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>Pgeil</Text>
          <View style={styles.betaBadge}>
            <Text style={styles.betaText}>BETA</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Learn German</Text>
          <Text style={styles.subtitle}>Browse lessons by category</Text>
        </View>

        {/* Difficulty Filter */}
        <DifficultyFilter
          selected={difficultyFilter}
          onSelect={setDifficultyFilter}
        />

        {/* Categories */}
        {lessonsLoading ? (
          <View style={styles.categorySection}>
            <FlatList
              horizontal
              data={[1, 2, 3]}
              renderItem={() => <SkeletonCard style={styles.skeletonCard} />}
              keyExtractor={(item) => `skeleton-${item}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        ) : lessons.length === 0 ? (
          <EmptyState
            icon="📚"
            title="No lessons found"
            message={`Try changing the difficulty filter or check back later.`}
            actionLabel="Reset Filter"
            onAction={() => setDifficultyFilter('all')}
          />
        ) : (
          categories.map((category) => {
            // Filter lessons by category
            const categoryLessons = lessons.filter(
              (lesson) => lesson.category.slug === category.slug
            );

            if (categoryLessons.length === 0) return null;

            return (
              <View key={category.slug} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>
                    {category.name} ({categoryLessons.length} lessons)
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleViewAll(category.slug, category.name)}
                  >
                    <Text style={styles.viewAllButton}>View all ›</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  horizontal
                  data={categoryLessons}
                  renderItem={({ item }) => (
                    <LessonCard
                      lesson={item}
                      onPress={() => handleLessonPress(item.id)}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.accentBlue,
    letterSpacing: -0.5,
  },
  betaBadge: {
    backgroundColor: colors.accentCyan,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  betaText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.bgPrimary,
    letterSpacing: 0.5,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.md,
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
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  categoryTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  viewAllButton: {
    ...textStyles.label,
    color: colors.accentBlue,
    fontWeight: '600',
  },
  horizontalList: {
    paddingHorizontal: spacing.md,
  },
  skeletonCard: {
    width: 280,
    marginRight: spacing.sm,
  },
});

export default HomeScreen;
