import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../styles/theme';

interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'large',
  color = colors.accentBlue,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
  },
});

// Skeleton Loader for cards
interface SkeletonCardProps {
  style?: ViewStyle;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => {
  return (
    <View style={[styles.skeletonCard, style]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonSubtitle} />
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
