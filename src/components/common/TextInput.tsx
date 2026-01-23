import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { textStyles } from '../../styles/typography';

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'email' | 'password';
}

export const TextInput: React.FC<CustomTextInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  variant = 'default',
  secureTextEntry,
  ...textInputProps
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Determine if this is a password field
  const isPasswordField = variant === 'password' || secureTextEntry;

  // Auto-configure keyboard type based on variant
  const keyboardType = variant === 'email' ? 'email-address' : textInputProps.keyboardType;

  // Get icon based on variant
  const getVariantIcon = () => {
    if (leftIcon) return leftIcon;
    if (variant === 'email') {
      return <Icon name="mail-outline" size={20} color={isFocused ? colors.retroCyan : colors.textMuted} />;
    }
    if (variant === 'password' || isPasswordField) {
      return <Icon name="lock-closed-outline" size={20} color={isFocused ? colors.retroCyan : colors.textMuted} />;
    }
    return null;
  };

  const variantIcon = getVariantIcon();

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
        </View>
      )}

      {/* Input wrapper */}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapper_focused,
          error && styles.inputWrapper_error,
        ]}>
        {/* Left icon */}
        {variantIcon && <View style={styles.leftIcon}>{variantIcon}</View>}

        {/* Text input */}
        <RNTextInput
          {...textInputProps}
          style={[styles.input, textInputProps.style]}
          placeholderTextColor="rgba(255,255,255,0.4)"
          secureTextEntry={isPasswordField && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={variant === 'email' ? 'none' : textInputProps.autoCapitalize}
          autoCorrect={variant === 'email' ? false : textInputProps.autoCorrect}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
        />

        {/* Password visibility toggle */}
        {isPasswordField && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}>
            <Icon
              name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color={isFocused ? colors.retroCyan : colors.textMuted}
            />
          </TouchableOpacity>
        )}

        {/* Right icon (custom) */}
        {!isPasswordField && rightIcon && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>

      {/* Error or helper text */}
      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={14} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  labelContainer: {
    marginBottom: spacing.xs + 2,
  },
  label: {
    ...textStyles.label,
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: spacing.md + 4,
    height: 56,
    // Subtle inner shadow effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapper_focused: {
    borderColor: colors.retroCyan,
    backgroundColor: 'rgba(0,188,212,0.08)',
    shadowColor: colors.retroCyan,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  inputWrapper_error: {
    borderColor: colors.error,
    backgroundColor: 'rgba(244,67,54,0.08)',
  },
  input: {
    flex: 1,
    ...textStyles.body,
    color: '#fff',
    fontSize: 16,
    height: '100%',
    textAlignVertical: 'center',
  },
  leftIcon: {
    marginRight: spacing.sm + 4,
    width: 24,
    alignItems: 'center',
  },
  rightIcon: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs + 2,
    gap: 6,
  },
  errorText: {
    ...textStyles.caption,
    color: colors.error,
    fontSize: 13,
  },
  helperText: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});

export default TextInput;

