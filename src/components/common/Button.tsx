import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';
import { textStyles } from '../../styles/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`button_${variant}`],
        styles[`button_${size}`],
        isDisabled && styles.button_disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.accentBlue : colors.textPrimary}
          size="small"
        />
      ) : (
        <Text style={[styles.buttonText, styles[`buttonText_${variant}`], textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.medium,
    ...shadows.sm,
  },
  
  // Variants
  button_primary: {
    backgroundColor: colors.accentBlue,
  },
  button_secondary: {
    backgroundColor: colors.bgElevated,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.accentBlue,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  button_small: {
    height: 36,
    paddingHorizontal: spacing.md,
  },
  button_medium: {
    height: 48,
    paddingHorizontal: spacing.lg,
  },
  button_large: {
    height: 56,
    paddingHorizontal: spacing.xl,
  },

  // Disabled state
  button_disabled: {
    opacity: 0.5,
  },

  // Text styles
  buttonText: {
    ...textStyles.button,
    color: colors.textPrimary,
  },
  buttonText_primary: {
    color: colors.textPrimary,
  },
  buttonText_secondary: {
    color: colors.textPrimary,
  },
  buttonText_outline: {
    color: colors.accentBlue,
  },
  buttonText_ghost: {
    color: colors.accentBlue,
  },
});

export default Button;
