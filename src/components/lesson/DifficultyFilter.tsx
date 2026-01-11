// DifficultyFilter component - Neo-Retro toggle for Beginner/Experienced filter

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../../styles/theme';

interface DifficultyFilterProps {
  selected: 'all' | 'beginner' | 'experienced';
  onSelect: (difficulty: 'all' | 'beginner' | 'experienced') => void;
}

export const DifficultyFilter: React.FC<DifficultyFilterProps> = ({ selected, onSelect }) => {
  const options = [
    { value: 'beginner' as const, label: 'BEGINNER', description: 'A1-A2', color: colors.retroCyan },
    { value: 'experienced' as const, label: 'EXPERIENCED', description: 'B1-C2', color: colors.retroCoral },
  ];

  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isActive = selected === option.value;
        const isFirst = index === 0;
        
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option, 
              isActive && [styles.optionActive, { backgroundColor: option.color }]
            ]}
            onPress={() => onSelect(isActive ? 'all' : option.value)}
            activeOpacity={0.9}
          >
            {/* Color bar at top */}
            {!isActive && (
              <View style={[styles.topBar, { backgroundColor: option.color }]} />
            )}
            <Text style={[
              styles.optionTitle, 
              { color: isFirst ? colors.retroCyan : colors.retroCoral },
              isActive && styles.optionTitleActive
            ]}>
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

// Compact styles
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  option: {
    flex: 1,
    backgroundColor: colors.retroCream,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    position: 'relative',
    overflow: 'hidden',
    // Neo-retro offset shadow - smaller
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 3,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  optionActive: {
    borderColor: colors.retroBorder,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionTitleActive: {
    color: colors.retroDark,
  },
  optionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  optionDescriptionActive: {
    color: colors.retroDark,
  },
});

export default DifficultyFilter;
