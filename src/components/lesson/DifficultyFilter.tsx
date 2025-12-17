// DifficultyFilter component - toggle for Beginner/Experienced filter

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { textStyles } from '../../styles/typography';

interface DifficultyFilterProps {
  selected: 'all' | 'beginner' | 'experienced';
  onSelect: (difficulty: 'all' | 'beginner' | 'experienced') => void;
}

export const DifficultyFilter: React.FC<DifficultyFilterProps> = ({ selected, onSelect }) => {
  const options = [
    { value: 'beginner' as const, label: 'Beginner', description: 'A1-A2' },
    { value: 'experienced' as const, label: 'Experienced', description: 'B1-C2' },
  ];

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = selected === option.value;
        
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.option, isActive && styles.optionActive]}
            onPress={() => onSelect(isActive ? 'all' : option.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionTitle, isActive && styles.optionTitleActive]}>
              {option.label}
            </Text>
            <Text style={[styles.optionDescription, isActive && styles.optionDescriptionActive]}>
              {option.description}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  option: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionActive: {
    backgroundColor: colors.accentBlue + '20', // 20% opacity
    borderColor: colors.accentBlue,
  },
  optionTitle: {
    ...textStyles.labelLarge,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  optionTitleActive: {
    color: colors.accentBlue,
    fontWeight: '700',
  },
  optionDescription: {
    fontSize: 12,
    color: colors.textMuted,
  },
  optionDescriptionActive: {
    color: colors.accentBlue,
  },
});

export default DifficultyFilter;
