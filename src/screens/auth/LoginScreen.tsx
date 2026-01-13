import React, {useState} from 'react';
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
  Vibration,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../../hooks/useAuth';
import {useSettings} from '../../contexts/SettingsContext';
import TextInput from '../../components/common/TextInput';
import Button from '../../components/common/Button';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import {validateEmail, validateRequired} from '../../utils/validation';
import {colors, spacing} from '../../styles/theme';
import {textStyles} from '../../styles/typography';
import type {AuthStackScreenProps} from '../../navigation/types';

type LoginScreenProps = AuthStackScreenProps<'Login'>;

export const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const {login, loginWithGoogle} = useAuth();
  const {settings} = useSettings();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Validate form
  const validateForm = (): boolean => {
    const emailErr = validateEmail(email);
    const passwordErr = validateRequired(password, 'Password');

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    return !emailErr && !passwordErr;
  };

  // Trigger error vibration (only if enabled in settings)
  const triggerErrorVibration = () => {
    if (!settings.hapticEnabled) return;
    Vibration.vibrate([0, 50, 50, 50]);
  };

  // Handle login submit
  const handleLogin = async () => {
    if (!validateForm()) {
      triggerErrorVibration();
      return;
    }

    setLoading(true);

    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        console.log('[LoginScreen] Login successful');
        navigation.navigate('Main');
      } else {
        triggerErrorVibration();
        Alert.alert('Login Failed', result.error || 'Invalid email or password');
      }
    } catch (error) {
      console.error('[LoginScreen] Login error:', error);
      triggerErrorVibration();
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
        console.log('[LoginScreen] Google Sign-In successful');
        navigation.navigate('Main');
      } else {
        triggerErrorVibration();
        Alert.alert('Sign In Failed', result.error || 'Google Sign-In failed');
      }
    } catch (error) {
      console.error('[LoginScreen] Google Sign-In error:', error);
      triggerErrorVibration();
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Navigate to Register screen
  const handleRegisterPress = () => {
    navigation.navigate('Register');
  };

  // Close modal
  const handleClose = () => {
    navigation.getParent()?.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Icon name="close" size={24} color={colors.retroDark} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue learning German
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
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
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              disabled={loading || googleLoading}
              style={styles.loginButton}
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
            disabled={loading || googleLoading}
          />

          {/* Register Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegisterPress} disabled={loading}>
              <Text style={styles.registerLink}>Sign Up</Text>
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
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.retroCream,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 3,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
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
  loginButton: {
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
  registerLink: {
    ...textStyles.body,
    color: colors.accentBlue,
    fontWeight: '600',
  },
});

export default LoginScreen;
