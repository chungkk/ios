import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface VoiceInputButtonProps {
  onPress: () => void;
  isListening: boolean;
  disabled?: boolean;
}

/**
 * VoiceInputButton Component
 * Microphone button with listening state
 */
const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onPress,
  isListening,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isListening && styles.buttonActive,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {isListening ? (
        <>
          <ActivityIndicator size="small" color={colors.textPrimary} />
          <Text style={styles.buttonText}>Listening...</Text>
        </>
      ) : (
        <>
          <Text style={styles.icon}>🎤</Text>
          <Text style={styles.buttonText}>Voice Input</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentBlue,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.small,
    gap: spacing.sm,
  },
  buttonActive: {
    backgroundColor: colors.accentRed,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  icon: {
    fontSize: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

export default VoiceInputButton;
