import React, {useState} from 'react';
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
import {colors, spacing, borderRadius} from '../../styles/theme';
import {textStyles} from '../../styles/typography';

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

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Input wrapper */}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapper_focused,
          error && styles.inputWrapper_error,
        ]}>
        {/* Left icon */}
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        {/* Text input */}
        <RNTextInput
          {...textInputProps}
          style={[styles.input, textInputProps.style]}
          placeholderTextColor={colors.textMuted}
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
              color={colors.textMuted}
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
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...textStyles.label,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 2,
    borderColor: colors.borderColor,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputWrapper_focused: {
    borderColor: colors.accentBlue,
  },
  inputWrapper_error: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    ...textStyles.body,
    color: colors.textOnDark,
    height: '100%',
    textAlignVertical: 'center',
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  errorText: {
    ...textStyles.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  helperText: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});

export default TextInput;
