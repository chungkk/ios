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
