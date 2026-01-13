// LessonCard component - Neo-Retro Design
// Migrated from ppgeil/components/LessonCard.js with retro styling

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { Lesson } from '../../types/lesson.types';
import { colors, spacing } from '../../styles/theme';
import { layout } from '../../constants/sizes';
import { getThumbnailUrl, formatDuration, formatViewCount, getDifficultyLabel } from '../../utils/youtube';
import { BASE_URL } from '../../services/api';
import CategoryTag from './CategoryTag';

interface LessonCardProps {
  lesson: Lesson;
  onPress: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, onPress }) => {
  // Get thumbnail URL - handle local paths from API
  const getThumbnail = (): string => {
    // If lesson has local thumbnail path (e.g., /thumbnails/xxx.jpg)
    if (lesson.thumbnail) {
      if (lesson.thumbnail.startsWith('/')) {
        // Local path - prepend API base URL
        return `${BASE_URL}${lesson.thumbnail}`;
      }
      // Already full URL
      return lesson.thumbnail;
    }
    // Fallback to YouTube thumbnail
    return getThumbnailUrl(lesson.youtubeUrl) || '';
  };
  
  const thumbnail = getThumbnail();
  const difficultyLabel = getDifficultyLabel(lesson.level);
  const difficultyColor = getDifficultyColor(lesson.level);
  const needsWhiteText = ['b2', 'c2'].includes(lesson.level?.toLowerCase() || '');

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      activeOpacity={0.9}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        
        {/* Difficulty badge - top right */}
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
          <Text style={[styles.difficultyText, needsWhiteText && styles.whiteText]}>
            {difficultyLabel}
          </Text>
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
    a1: colors.retroCyan,
    a2: '#7FDBDA',
    b1: colors.retroYellow,
    b2: colors.retroCoral,
    c1: colors.retroPink,
    c2: colors.retroPurple,
  };
  return levelMap[level.toLowerCase()] || colors.retroCyan;
};

// Compact Neo-Retro styles
const styles = StyleSheet.create({
  card: {
    width: layout.lessonCardWidth,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    // Neo-retro offset shadow - smaller
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 3,
  },
  thumbnailContainer: {
    height: layout.lessonCardImageHeight,
    position: 'relative',
    backgroundColor: colors.bgCream,
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  difficultyBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.retroBorder,
  },
  difficultyText: {
    color: colors.retroDark,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  whiteText: {
    color: '#ffffff',
  },
  duration: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: colors.retroDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.retroBorder,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 10,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.retroDark,
    marginBottom: 6,
    lineHeight: 15,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewCount: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default LessonCard;
