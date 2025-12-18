// SpeedSelector - Modal for selecting playback speed

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface SpeedSelectorProps {
  visible: boolean;
  onClose: () => void;
  currentSpeed: number;
  onSelectSpeed: (speed: number) => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const SpeedSelector: React.FC<SpeedSelectorProps> = ({
  visible,
  onClose,
  currentSpeed,
  onSelectSpeed,
}) => {
  const handleSelect = (speed: number) => {
    onSelectSpeed(speed);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Tốc độ phát</Text>
          </View>

          <View style={styles.speedList}>
            {SPEED_OPTIONS.map((speed) => {
              const isActive = speed === currentSpeed;
              return (
                <TouchableOpacity
                  key={speed}
                  style={[styles.speedItem, isActive && styles.speedItemActive]}
                  onPress={() => handleSelect(speed)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.speedText, isActive && styles.speedTextActive]}>
                    {speed}x
                  </Text>
                  {isActive && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: '#1a2235',
    borderRadius: borderRadius.large,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  speedList: {
    paddingVertical: spacing.sm,
  },
  speedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  speedItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  speedText: {
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  speedTextActive: {
    color: colors.accentBlue,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: colors.accentBlue,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default SpeedSelector;
