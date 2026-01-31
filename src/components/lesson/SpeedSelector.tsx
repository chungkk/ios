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
import { colors, spacing } from '../../styles/theme';

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
      supportedOrientations={['portrait', 'landscape']}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: colors.retroCream,
    borderRadius: 16,
    width: '100%',
    maxWidth: 280,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.retroBorder,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 12,
  },
  header: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.retroPurple,
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  speedList: {
    paddingVertical: spacing.sm,
  },
  speedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.sm,
    marginVertical: 2,
    borderRadius: 10,
  },
  speedItemActive: {
    backgroundColor: 'rgba(0, 188, 212, 0.2)',
    borderWidth: 2,
    borderColor: colors.retroCyan,
  },
  speedText: {
    fontSize: 16,
    color: colors.retroDark,
    fontWeight: '600',
  },
  speedTextActive: {
    color: colors.retroCyan,
    fontWeight: '800',
  },
  checkmark: {
    fontSize: 18,
    color: colors.retroCyan,
    fontWeight: '800',
  },
  cancelButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 2,
    borderTopColor: colors.retroBorder,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelText: {
    fontSize: 15,
    color: colors.retroDark,
    fontWeight: '700',
  },
});

export default SpeedSelector;
