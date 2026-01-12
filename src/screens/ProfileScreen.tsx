import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../hooks/useAuth';
import Button from '../components/common/Button';
import {Loading} from '../components/common/Loading';
import {colors, spacing, borderRadius, shadows} from '../styles/theme';
import {textStyles} from '../styles/typography';
import type {MainTabScreenProps} from '../navigation/types';

type ProfileScreenProps = MainTabScreenProps<'Profile'>;

export const ProfileScreen: React.FC<ProfileScreenProps> = ({navigation}) => {
  const {t} = useTranslation();
  const {user, loading, userPoints, logout, refreshUser} = useAuth();

  // Refresh user data on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
      {cancelable: true},
    );
  };

  const handleEditProfile = () => {
    Alert.alert(t('profile.comingSoon'), t('profile.editComingSoon'));
  };

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('profile.loginRequired')}</Text>
          <Button
            title={t('profile.login')}
            variant="primary"
            onPress={() => {
              // @ts-ignore - Navigation type issue
              navigation.navigate('Auth', {screen: 'Login'});
            }}
            style={{marginTop: spacing.lg}}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Ensure user name and email are strings
  const userName = String(user.name || 'User');
  const userEmail = String(user.email || 'No email');
  
  // Handle streak - could be number or object with currentStreak
  const streakValue = typeof user.streak === 'object' && user.streak !== null
    ? (user.streak as any).currentStreak || 0
    : user.streak || 0;
  
  // Handle answerStreak - could be number or object with current
  const answerStreakValue = typeof user.answerStreak === 'object' && user.answerStreak !== null
    ? (user.answerStreak as any).current || 0
    : user.answerStreak || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userPoints || 0}</Text>
            <Text style={styles.statLabel}>{t('profile.points')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streakValue}</Text>
            <Text style={styles.statLabel}>{t('profile.dayStreak')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{answerStreakValue}</Text>
            <Text style={styles.statLabel}>{t('profile.answerStreak')}</Text>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>{t('profile.accountInfo')}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('settings.nativeLanguage')}</Text>
            <Text style={styles.infoValue}>
              {(user.nativeLanguage || 'N/A').toUpperCase()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('settings.learningLevel')}</Text>
            <Text style={styles.infoValue}>
              {user.level ? user.level.charAt(0).toUpperCase() + user.level.slice(1) : 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.difficultyPreference')}</Text>
            <Text style={styles.infoValue}>
              {(user.preferredDifficultyLevel || 'N/A').toUpperCase()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.accountType')}</Text>
            <Text style={styles.infoValue}>
              {user.authProvider === 'email' ? 'Email/Password' : user.authProvider === 'google' ? 'Google' : 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.memberSince')}</Text>
            <Text style={styles.infoValue}>
              {user.createdAt 
                ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'
              }
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title={t('profile.editProfile')}
            variant="secondary"
            onPress={handleEditProfile}
            style={styles.actionButton}
          />

          <Button
            title={t('settings.logout')}
            variant="outline"
            onPress={handleLogout}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  avatarText: {
    ...textStyles.h1,
    color: colors.textPrimary,
    fontSize: 36,
  },
  name: {
    ...textStyles.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  email: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    ...textStyles.h2,
    color: colors.accentBlue,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  infoContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.medium,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  infoValue: {
    ...textStyles.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: spacing.md,
  },
  actionButton: {
    marginBottom: 0,
  },
});

export default ProfileScreen;
