// Size constants for React Native components
// Dimensions, spacing, and layout constants

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Screen dimensions
export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};

// Layout sizes
export const layout = {
  // Container padding
  containerPadding: 16,
  containerPaddingLarge: 24,

  // Header heights
  headerHeight: 60,
  headerHeightLarge: 80,
  
  // Bottom navigation
  bottomNavHeight: 60,
  bottomNavHeightWithSafeArea: 80, // + safe area

  // Card sizes
  cardPadding: 16,
  cardMargin: 12,

  // List item heights
  listItemHeight: 72,
  listItemHeightSmall: 56,
  listItemHeightLarge: 96,

  // Input heights
  inputHeight: 48,
  inputHeightSmall: 40,
  inputHeightLarge: 56,

  // Button heights
  buttonHeight: 48,
  buttonHeightSmall: 36,
  buttonHeightLarge: 56,

  // Icon sizes
  iconSmall: 16,
  iconMedium: 24,
  iconLarge: 32,
  iconXLarge: 48,

  // Thumbnail sizes
  thumbnailSmall: 60,
  thumbnailMedium: 100,
  thumbnailLarge: 150,
  thumbnailXLarge: 200,

  // Lesson card dimensions
  lessonCardWidth: SCREEN_WIDTH * 0.65, // 65% of screen width for horizontal scroll - more compact
  lessonCardHeight: 180,
  lessonCardImageHeight: 100,
};

// Spacing scale (matches theme.ts)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border widths
export const borderWidth = {
  thin: 1,
  medium: 2,
  thick: 4,
};

// Border radius (matches theme.ts)
export const borderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xl: 24,
  round: 9999,
};

// Opacity levels
export const opacity = {
  disabled: 0.5,
  overlay: 0.7,
  subtle: 0.8,
  medium: 0.6,
  light: 0.3,
};

// Z-index layers
export const zIndex = {
  background: -1,
  base: 0,
  elevated: 10,
  dropdown: 100,
  modal: 1000,
  toast: 2000,
  tooltip: 3000,
};

// Animation durations (in milliseconds)
export const duration = {
  fast: 150,
  normal: 300,
  slow: 500,
};

export const sizes = {
  screen,
  layout,
  spacing,
  borderWidth,
  borderRadius,
  opacity,
  zIndex,
  duration,
};

export default sizes;
