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
import { colors, spacing } from '../../styles/theme';

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

  const isPasswordField = variant === 'password' || secureTextEntry;
  const keyboardType = variant === 'email' ? 'email-address' : textInputProps.keyboardType;

  const getVariantIcon = () => {
    if (leftIcon) return leftIcon;
    if (variant === 'email') {
      return (
        <View style={[styles.iconBadge, isFocused && styles.iconBadgeFocused]}>
          <Icon name="mail" size={16} color={isFocused ? '#fff' : colors.textMuted} />
        </View>
      );
    }
    if (variant === 'password' || isPasswordField) {
      return (
        <View style={[styles.iconBadge, isFocused && styles.iconBadgeFocused]}>
          <Icon name="lock-closed" size={16} color={isFocused ? '#fff' : colors.textMuted} />
        </View>
      );
    }
    return null;
  };

  const variantIcon = getVariantIcon();

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={[styles.label, isFocused && styles.labelFocused]}>{label}</Text>
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
          placeholderTextColor="rgba(255,255,255,0.35)"
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
              name={isPasswordVisible ? 'eye' : 'eye-off'}
              size={20}
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  labelFocused: {
    color: colors.retroCyan,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
  },
  inputWrapper_focused: {
    borderColor: colors.retroCyan,
    backgroundColor: 'rgba(0,188,212,0.08)',
  },
  inputWrapper_error: {
    borderColor: colors.error,
    backgroundColor: 'rgba(244,67,54,0.06)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    height: '100%',
    letterSpacing: 0.3,
  },
  leftIcon: {
    marginRight: 12,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeFocused: {
    backgroundColor: colors.retroCyan,
  },
  rightIcon: {
    marginLeft: 8,
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
  },
});

export default TextInput;
