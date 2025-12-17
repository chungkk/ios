import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../styles/theme';

interface OfflineIndicatorProps {
  isVisible: boolean;
  message?: string;
}

/**
 * OfflineIndicator Component
 * Warning banner shown when device is offline
 */
const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isVisible,
  message = 'No internet connection. You can only access downloaded lessons.',
}) => {
  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  icon: {
    fontSize: 18,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.bgPrimary,
  },
});

export default OfflineIndicator;
