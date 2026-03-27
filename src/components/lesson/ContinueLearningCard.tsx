// ContinueLearningCard - Compact card showing lesson in progress with progress bar
// Used in the "Continue Learning" section on the home screen

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../../styles/theme';
import { BASE_URL } from '../../services/api';
import { getDifficultyLabel } from '../../utils/youtube';
import type { InProgressLesson } from '../../services/continueLearning.service';

interface ContinueLearningCardProps {
  lesson: InProgressLesson;
  onPress: () => void;
}

const getDifficultyColor = (level: string): string => {
  if (!level) return colors.retroCyan;
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

export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({
  lesson,
  onPress,
}) => {
  const thumbnailUri = lesson.thumbnail
    ? lesson.thumbnail.startsWith('/')
      ? `${BASE_URL}${lesson.thumbnail}`
      : lesson.thumbnail
    : '';

  const difficultyColor = getDifficultyColor(lesson.level);
  const difficultyLabel = getDifficultyLabel(lesson.level);
  const modeLabel = lesson.mode === 'shadowing' ? '🎤' : '✍️';
  const progressPercent = lesson.progressPercent;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderThumbnail]} />
        )}

        {/* Difficulty badge */}
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
          <Text style={styles.difficultyText}>{difficultyLabel}</Text>
        </View>

        {/* Mode badge */}
        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>{modeLabel}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {lesson.lessonTitle}
        </Text>
        <Text style={styles.category}>{lesson.categoryName}</Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.max(progressPercent, 3)}%` },
                progressPercent >= 50
                  ? styles.progressBarHigh
                  : styles.progressBarLow,
              ]}
            />
          </View>
          <Text style={styles.progressText}>{progressPercent}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 170,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 3,
  },
  thumbnailContainer: {
    height: 80,
    position: 'relative',
    backgroundColor: colors.bgCream,
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    backgroundColor: colors.bgCream,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.retroBorder,
  },
  difficultyText: {
    color: colors.retroDark,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  modeBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.retroBorder,
  },
  modeText: {
    fontSize: 12,
  },
  content: {
    padding: 8,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.retroDark,
    marginBottom: 2,
    lineHeight: 14,
  },
  category: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#e8e8e8',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressBarLow: {
    backgroundColor: colors.retroCoral,
  },
  progressBarHigh: {
    backgroundColor: colors.retroCyan,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.retroDark,
    minWidth: 28,
    textAlign: 'right',
  },
});

export default ContinueLearningCard;
