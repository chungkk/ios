import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import TextInput from '../../components/common/TextInput';
import Button from '../../components/common/Button';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import AppleSignInButton from '../../components/auth/AppleSignInButton';
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirm,
  getPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from '../../utils/validation';
import { colors, spacing } from '../../styles/theme';
import { textStyles } from '../../styles/typography';
import type { AuthStackScreenProps } from '../../navigation/types';

type RegisterScreenProps = AuthStackScreenProps<'Register'>;

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register, loginWithGoogle, loginWithApple } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nameError, setNameError] = useState<string>();
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>();

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  // Calculate password strength
  const passwordStrength = getPasswordStrength(password);
  const passwordStrengthLabel = getPasswordStrengthLabel(password);
  const passwordStrengthColor = getPasswordStrengthColor(password);

  // Validate form
  const validateForm = (): boolean => {
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmErr = validatePasswordConfirm(password, confirmPassword);

    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmErr);

    return !nameErr && !emailErr && !passwordErr && !confirmErr;
  };

  // Handle register submit
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await register(name.trim(), email.trim(), password);

      if (result.success) {
        console.log('[RegisterScreen] Registration successful');
        navigation.navigate('Main');
      } else {
        Alert.alert('Registration Failed', result.error || 'Unable to create account');
      }
    } catch (error) {
      console.error('[RegisterScreen] Registration error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      const result = await loginWithGoogle();

      if (result.success) {
        console.log('[RegisterScreen] Google Sign-In successful');
        navigation.navigate('Main');
      } else {
        Alert.alert('Sign In Failed', result.error || 'Google Sign-In failed');
      }
    } catch (error) {
      console.error('[RegisterScreen] Google Sign-In error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Apple Sign-In
  const handleAppleSignIn = async () => {
    setAppleLoading(true);

    try {
      const result = await loginWithApple();

      if (result.success) {
        console.log('[RegisterScreen] Apple Sign-In successful');
        navigation.navigate('Main');
      } else {
        Alert.alert('Sign In Failed', result.error || 'Apple Sign-In failed');
      }
    } catch (error) {
      console.error('[RegisterScreen] Apple Sign-In error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setAppleLoading(false);
    }
  };

  // Navigate to Login screen
  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join us to start learning German
            </Text>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
            <TextInput
              label="Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setNameError(undefined);
              }}
              error={nameError}
              editable={!loading}
            />

            <TextInput
              label="Email"
              variant="email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError(undefined);
              }}
              error={emailError}
              editable={!loading}
            />

            <TextInput
              label="Password"
              variant="password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError(undefined);
              }}
              error={passwordError}
              editable={!loading}
            />

            {/* Password strength indicator */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <View
                      key={index}
                      style={[
                        styles.strengthSegment,
                        index <= passwordStrength && {
                          backgroundColor: passwordStrengthColor,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text
                  style={[
                    styles.strengthLabel,
                    { color: passwordStrengthColor },
                  ]}>
                  {passwordStrengthLabel}
                </Text>
              </View>
            )}

            <TextInput
              label="Confirm Password"
              variant="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setConfirmPasswordError(undefined);
              }}
              error={confirmPasswordError}
              editable={!loading}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              disabled={loading || googleLoading || appleLoading}
              style={styles.registerButton}
            />
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-In */}
          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            loading={googleLoading}
            disabled={loading || googleLoading || appleLoading}
          />

          {/* Apple Sign-In */}
          <AppleSignInButton
            onPress={handleAppleSignIn}
            loading={appleLoading}
            disabled={loading || googleLoading || appleLoading}
          />

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLoginPress} disabled={loading}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...textStyles.h1,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textLight,
  },
  form: {
    marginBottom: spacing.lg,
  },
  strengthContainer: {
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  strengthBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    backgroundColor: colors.bgSecondary,
    borderRadius: 2,
  },
  strengthLabel: {
    ...textStyles.caption,
    fontSize: 12,
  },
  registerButton: {
    marginTop: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderColor,
  },
  dividerText: {
    ...textStyles.caption,
    color: colors.textLight,
    marginHorizontal: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    ...textStyles.body,
    color: colors.textLight,
  },
  loginLink: {
    ...textStyles.body,
    color: colors.accentBlue,
    fontWeight: '600',
  },
});

export default RegisterScreen;
