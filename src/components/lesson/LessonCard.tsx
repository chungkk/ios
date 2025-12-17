// LessonCard component - migrated from ppgeil/components/LessonCard.js
// Displays lesson card with thumbnail, metadata, difficulty badge

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { Lesson } from '../../types/lesson.types';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';
import { textStyles } from '../../styles/typography';
import { layout } from '../../constants/sizes';
import { getThumbnailUrl, formatDuration, formatViewCount, getDifficultyLabel } from '../../utils/youtube';
import CategoryTag from './CategoryTag';

interface LessonCardProps {
  lesson: Lesson;
  onPress: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, onPress }) => {
  const thumbnail = lesson.thumbnail || getThumbnailUrl(lesson.youtubeUrl) || '';
  const difficultyLabel = getDifficultyLabel(lesson.level);
  const difficultyColor = getDifficultyColor(lesson.level);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        
        {/* Badges */}
        <View style={styles.badgesContainer}>
          {/* View count */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>👁 {formatViewCount(lesson.viewCount)}</Text>
          </View>
          
          {/* Difficulty badge */}
          <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
            <Text style={styles.difficultyText}>{difficultyLabel}</Text>
          </View>
        </View>

        {/* Duration */}
        {lesson.videoDuration > 0 && (
          <View style={styles.duration}>
            <Text style={styles.durationText}>⏱ {formatDuration(lesson.videoDuration)}</Text>
          </View>
        )}

        {/* Source indicator */}
        <View style={styles.sourceIndicator}>
          <Text style={styles.sourceText}>▶ YouTube</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {lesson.category && (
          <CategoryTag category={lesson.category} size="small" />
        )}
        <Text style={styles.title} numberOfLines={2}>
          {lesson.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const getDifficultyColor = (level: string): string => {
  const levelMap: Record<string, string> = {
    a1: colors.difficultyA1,
    a2: colors.difficultyA2,
    b1: colors.difficultyB1,
    b2: colors.difficultyB2,
    c1: colors.difficultyC1,
    c2: colors.difficultyC2,
  };
  return levelMap[level.toLowerCase()] || colors.difficultyA1;
};

const styles = StyleSheet.create({
  card: {
    width: layout.lessonCardWidth,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    marginRight: spacing.sm,
    ...shadows.md,
  },
  thumbnailContainer: {
    height: layout.lessonCardImageHeight,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.bgElevated,
  },
  badgesContainer: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
  },
  difficultyText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  duration: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
  },
  durationText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  sourceIndicator: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
  },
  title: {
    ...textStyles.bodyLarge,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
});

export default LessonCard;
