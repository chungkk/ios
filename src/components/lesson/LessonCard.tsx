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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        
        {/* Difficulty badge - top right */}
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
          <Text style={styles.difficultyText}>{difficultyLabel}</Text>
        </View>

        {/* Duration - bottom right */}
        {lesson.videoDuration > 0 && (
          <View style={styles.duration}>
            <Text style={styles.durationText}>{formatDuration(lesson.videoDuration)}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {lesson.title}
        </Text>
        <View style={styles.footer}>
          {lesson.category && (
            <CategoryTag category={lesson.category} size="small" />
          )}
          <Text style={styles.viewCount}>{formatViewCount(lesson.viewCount)} views</Text>
        </View>
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
    marginRight: spacing.md,
    ...shadows.sm,
  },
  thumbnailContainer: {
    height: layout.lessonCardImageHeight,
    position: 'relative',
    backgroundColor: colors.bgElevated,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  difficultyBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.small,
  },
  difficultyText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  duration: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: spacing.sm,
  },
  title: {
    ...textStyles.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  viewCount: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
});

export default LessonCard;
