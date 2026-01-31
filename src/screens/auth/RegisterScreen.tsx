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
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
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
  const { register, resendVerification, loginWithGoogle, loginWithApple } = useAuth();

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
  const [resendLoading, setResendLoading] = useState(false);

  // Verification pending state
  const [showVerificationPending, setShowVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Bounce animation for verification icon
  const [bounceAnim] = useState(new Animated.Value(0));

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

  // Start bounce animation
  const startBounceAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  // Handle register submit
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await register(name.trim(), email.trim(), password);

      if (result.success && result.requiresVerification) {
        // Show verification pending UI
        setRegisteredEmail(result.email || email.trim());
        setShowVerificationPending(true);
        startBounceAnimation();
      } else if (!result.success) {
        Alert.alert('Registration Failed', result.error || 'Unable to create account');
      }
    } catch (error) {
      console.error('[RegisterScreen] Registration error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const result = await resendVerification(registeredEmail);
      if (result.success) {
        Alert.alert('Email Sent', result.message || 'Verification email has been sent.');
      } else {
        Alert.alert('Error', result.error || 'Failed to resend verification email.');
      }
    } catch (error) {
      console.error('[RegisterScreen] Resend verification error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setResendLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      const result = await loginWithGoogle();

      if (result.success) {
        console.log('[RegisterScreen] Google Sign-In successful');
        // Dismiss the Auth modal properly
        navigation.getParent()?.goBack();
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
        // Dismiss the Auth modal properly
        navigation.getParent()?.goBack();
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

  // Verification Pending UI
  if (showVerificationPending) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.verificationContent}
          showsVerticalScrollIndicator={false}>
          {/* Animated Icon */}
          <Animated.View
            style={[
              styles.verificationIconContainer,
              { transform: [{ translateY: bounceAnim }] },
            ]}>
            <Icon name="mail-outline" size={64} color={colors.accentBlue} />
          </Animated.View>

          {/* Title */}
          <Text style={styles.verificationTitle}>Check Your Email</Text>

          {/* Description */}
          <Text style={styles.verificationDescription}>
            We've sent a verification link to:
          </Text>

          {/* Email Highlight */}
          <View style={styles.emailHighlight}>
            <Icon name="mail" size={20} color={colors.accentBlue} />
            <Text style={styles.emailText}>{registeredEmail}</Text>
          </View>

          {/* Instructions */}
          <Text style={styles.verificationInstructions}>
            Click the link in your email to verify your account and start learning German!
          </Text>

          {/* Resend Button */}
          <Button
            title="Resend Verification Email"
            onPress={handleResendVerification}
            loading={resendLoading}
            disabled={resendLoading}
            style={styles.resendButton}
            variant="secondary"
          />

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={handleLoginPress}>
            <Icon name="arrow-back" size={18} color={colors.accentBlue} />
            <Text style={styles.backToLoginText}>Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
  // Verification Pending Styles
  verificationContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  verificationIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 3,
    borderColor: colors.accentBlue,
  },
  verificationTitle: {
    ...textStyles.h1,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  verificationDescription: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emailHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.accentBlue,
    gap: spacing.sm,
  },
  emailText: {
    ...textStyles.body,
    color: colors.accentBlue,
    fontWeight: '700',
  },
  verificationInstructions: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  resendButton: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backToLoginText: {
    ...textStyles.body,
    color: colors.accentBlue,
    fontWeight: '600',
  },
});

export default RegisterScreen;
