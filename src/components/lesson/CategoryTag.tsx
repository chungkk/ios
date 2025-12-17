// CategoryTag component - displays category badge

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Category } from '../../types/lesson.types';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface CategoryTagProps {
  category: Category;
  size?: 'small' | 'medium';
}

export const CategoryTag: React.FC<CategoryTagProps> = ({ category, size = 'medium' }) => {
  return (
    <View style={[styles.tag, size === 'small' && styles.tagSmall]}>
      <Text style={[styles.tagText, size === 'small' && styles.tagTextSmall]}>
        {category.name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tag: {
    backgroundColor: colors.accentBlue,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
    alignSelf: 'flex-start',
  },
  tagSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextSmall: {
    fontSize: 10,
  },
});

export default CategoryTag;
