import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle, Text, Animated, Easing } from 'react-native';
import { colors, spacing } from '../../styles/theme';

interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
  message?: string;
  minimal?: boolean; // Use minimal version (just spinner) for inline loading
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'large',
  color = colors.retroCyan,
  style,
  message,
  minimal = false,
}) => {
  // Animation for pulsing effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate animation for decorative elements
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Minimal version for inline use
  if (minimal) {
    return (
      <View style={[styles.minimalContainer, style]}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Decorative background elements */}
      <Animated.View style={[styles.bgCircle, styles.bgCircle1, { transform: [{ rotate: spin }] }]} />
      <Animated.View style={[styles.bgCircle, styles.bgCircle2, { transform: [{ rotate: spin }] }]} />

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo/Icon */}
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.logoEmoji}>🎧</Text>
        </Animated.View>

        {/* App name */}
        <Text style={styles.appName}>PapaGeil</Text>
        <Text style={styles.tagline}>Learn German Naturally</Text>

        {/* Loading indicator */}
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size={size} color={colors.retroCyan} />
        </View>

        {/* Loading message */}
        {message && <Text style={styles.message}>{message}</Text>}
      </View>

      {/* Decorative dots */}
      <View style={styles.dotsContainer}>
        <View style={[styles.dot, { backgroundColor: colors.retroCoral }]} />
        <View style={[styles.dot, { backgroundColor: colors.retroYellow }]} />
        <View style={[styles.dot, { backgroundColor: colors.retroCyan }]} />
        <View style={[styles.dot, { backgroundColor: colors.retroPurple }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.retroCream,
  },
  minimalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 4,
    borderColor: colors.retroBorder,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 5,
  },
  logoEmoji: {
    fontSize: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.retroDark,
    letterSpacing: 1,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  spinnerContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.retroBorder,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 3,
  },
  message: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // Decorative background circles
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  bgCircle1: {
    width: 300,
    height: 300,
    borderColor: colors.retroCyan + '30',
  },
  bgCircle2: {
    width: 220,
    height: 220,
    borderColor: colors.retroYellow + '40',
  },
  // Decorative dots at bottom
  dotsContainer: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
});

const skeletonStyles = StyleSheet.create({
  skeletonCard: {
    width: 280,
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.bgSecondary,
    overflow: 'hidden',
  },
  skeletonImage: {
    width: '100%',
    height: 140,
    backgroundColor: colors.bgElevated,
  },
  skeletonContent: {
    padding: 12,
  },
  skeletonTitle: {
    height: 16,
    width: '80%',
    backgroundColor: colors.bgElevated,
    marginBottom: 8,
    borderRadius: 4,
  },
  skeletonSubtitle: {
    height: 12,
    width: '60%',
    backgroundColor: colors.bgElevated,
    borderRadius: 4,
  },
});

// Skeleton Loader for cards
interface SkeletonCardProps {
  style?: ViewStyle;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => {
  return (
    <View style={[skeletonStyles.skeletonCard, style]}>
      <View style={skeletonStyles.skeletonImage} />
      <View style={skeletonStyles.skeletonContent}>
        <View style={skeletonStyles.skeletonTitle} />
        <View style={skeletonStyles.skeletonSubtitle} />
      </View>
    </View>
  );
};

const styles_skeleton = StyleSheet.create({
  skeletonCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  skeletonImage: {
    height: 120,
    backgroundColor: colors.bgElevated,
  },
  skeletonContent: {
    padding: 16,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: colors.bgElevated,
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
  skeletonSubtitle: {
    height: 16,
    backgroundColor: colors.bgElevated,
    borderRadius: 4,
    width: '60%',
  },
});

Object.assign(styles, styles_skeleton);

export default Loading;
