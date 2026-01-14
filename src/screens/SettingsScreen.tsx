// SettingsScreen - App Settings & Profile
// Neo-Retro Design

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import i18n from '../utils/i18n';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../contexts/SettingsContext';
import { Loading } from '../components/common/Loading';
import Button from '../components/common/Button';
import { colors, spacing } from '../styles/theme';
import { BASE_URL } from '../services/api';

const LANGUAGES = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
];

// TODO: Uncomment when level selection UI is enabled
// const LEVELS = [
//   { value: 'A1', label: 'A1 - Beginner' },
//   { value: 'A2', label: 'A2 - Elementary' },
//   { value: 'B1', label: 'B1 - Intermediate' },
//   { value: 'B2', label: 'B2 - Upper Intermediate' },
//   { value: 'C1', label: 'C1 - Advanced' },
//   { value: 'C2', label: 'C2 - Proficient' },
// ];

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user, loading, userPoints, logout, refreshUser, updateUser } = useAuth();
  const { settings, toggleHaptic, setNativeLanguage } = useSettings();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAGBModal, setShowAGBModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleLogin = () => {
    navigation.navigate('Auth', { screen: 'Login' });
  };

  // Upload avatar to server
  const uploadAvatar = useCallback(async (uri: string, type: string, fileName: string) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri,
        type,
        name: fileName,
      } as any);

      const { getToken } = require('../services/storage.service');
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/api/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      console.log('[SettingsScreen] Upload avatar response:', JSON.stringify(data));
      if (data.success) {
        await refreshUser();
        console.log('[SettingsScreen] User after refresh:', JSON.stringify(user));
        Alert.alert('Success', 'Avatar updated successfully!');
      } else {
        Alert.alert('Error', data.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      Alert.alert('Error', 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  }, [refreshUser, user]);

  // Handle avatar change
  const handleChangeAvatar = useCallback(() => {
    Alert.alert(
      'Change Avatar',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => {
            launchCamera(
              { mediaType: 'photo', quality: 0.8, maxWidth: 500, maxHeight: 500 },
              (response) => {
                if (response.assets && response.assets[0]) {
                  const asset = response.assets[0];
                  uploadAvatar(
                    asset.uri!,
                    asset.type || 'image/jpeg',
                    asset.fileName || 'avatar.jpg'
                  );
                }
              }
            );
          },
        },
        {
          text: 'Photo Library',
          onPress: () => {
            launchImageLibrary(
              { mediaType: 'photo', quality: 0.8, maxWidth: 500, maxHeight: 500 },
              (response) => {
                if (response.assets && response.assets[0]) {
                  const asset = response.assets[0];
                  uploadAvatar(
                    asset.uri!,
                    asset.type || 'image/jpeg',
                    asset.fileName || 'avatar.jpg'
                  );
                }
              }
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [uploadAvatar]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  }, [logout, t]);

  // Handle native language change
  const handleChangeLanguage = useCallback(() => {
    Alert.alert(
      t('settings.nativeLanguage'),
      t('settings.selectLanguage'),
      [
        ...LANGUAGES.map(lang => ({
          text: lang.label,
          onPress: async () => {
            try {
              // Save to local settings (works without login)
              await setNativeLanguage(lang.value);

              // Also update on server if logged in
              if (user && updateUser) {
                await updateUser({ nativeLanguage: lang.value as 'vi' | 'en' | 'de' });
              }

              setTimeout(() => {
                // Use new language for success message
                Alert.alert(
                  i18n.t('common.success', { lng: lang.value }),
                  i18n.t('settings.languageChanged', { lng: lang.value })
                );
              }, 100);
            } catch {
              Alert.alert(t('common.error'), t('settings.updateFailed'));
            }
          },
        })),
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  }, [user, updateUser, setNativeLanguage, t]);

  // TODO: Uncomment when learning level change UI is enabled
  // const handleChangeLevel = useCallback(() => {
  //   Alert.alert(
  //     t('settings.learningLevel'),
  //     t('settings.selectLevel'),
  //     [
  //       ...LEVELS.map(level => ({
  //         text: level.label,
  //         onPress: async () => {
  //           try {
  //             if (updateUser) {
  //               const result = await updateUser({ level: level.value });
  //               if (result.success) {
  //                 Alert.alert(t('common.success'), t('settings.levelChanged'));
  //               }
  //             }
  //           } catch {
  //             Alert.alert(t('common.error'), t('settings.updateFailed'));
  //           }
  //         },
  //       })),
  //       { text: t('common.cancel'), style: 'cancel' },
  //     ]
  //   );
  // }, [updateUser, t]);

  // TODO: Uncomment when notifications UI is enabled
  // const handleNotifications = useCallback(() => {
  //   Alert.alert(
  //     t('settings.notifications'),
  //     t('settings.notificationsComingSoon'),
  //     [{ text: t('common.ok') }]
  //   );
  // }, [t]);

  // Handle about
  const handleAbout = useCallback(() => {
    Alert.alert(
      t('settings.aboutApp'),
      t('settings.aboutDescription'),
      [{ text: t('common.ok') }]
    );
  }, [t]);

  // TODO: Uncomment when rate app UI is enabled
  // const handleRateApp = useCallback(() => {
  //   // Replace YOUR_APP_ID with actual App Store ID after publishing
  //   const APP_STORE_ID = 'YOUR_APP_ID';
  //   const appStoreUrl = Platform.select({
  //     ios: `itms-apps://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`,
  //     default: `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`,
  //   });

  //   if (APP_STORE_ID === 'YOUR_APP_ID') {
  //     // App not yet on store - show thank you message
  //     Alert.alert(
  //       t('settings.rateApp'),
  //       t('settings.rateThankYou'),
  //       [{ text: t('common.ok') }]
  //     );
  //   } else {
  //     Linking.openURL(appStoreUrl).catch(() => {
  //       Alert.alert(t('common.error'), 'Could not open App Store');
  //     });
  //   }
  // }, [t]);

  if (loading) return <Loading />;

  // Get streak value safely
  const streakValue = typeof user?.streak === 'object' && user?.streak !== null
    ? (user.streak as any).currentStreak || 0
    : user?.streak || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚙️ {t('settings.title')}</Text>
        </View>

        {/* Profile Card */}
        {user ? (
          <View style={styles.profileCard}>
            <View style={styles.cardTopBar} />
            <View style={styles.cardContent}>
              <TouchableOpacity onPress={handleChangeAvatar} style={styles.avatarContainer}>
                {uploadingAvatar ? (
                  <View style={styles.avatar}>
                    <ActivityIndicator color="#fff" />
                  </View>
                ) : user.picture ? (
                  <Image
                    source={{ uri: user.picture.startsWith('/') ? `${BASE_URL}${user.picture}` : user.picture }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.editBadge}>
                  <Icon name="camera" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.userName}>{user.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statBadge}>
                  <Icon name="diamond" size={18} color={colors.retroYellow} />
                  <Text style={styles.statBadgeValue}>{userPoints || 0}</Text>
                </View>
                <View style={styles.statBadge}>
                  <Icon name="flame" size={18} color={colors.retroCoral} />
                  <Text style={styles.statBadgeValue}>{streakValue}</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.loginCard}>
            <View style={styles.cardTopBar} />
            <View style={styles.cardContent}>
              <Icon name="person-circle-outline" size={60} color={colors.retroPurple} />
              <Text style={styles.loginTitle}>{t('profile.loginRequired')}</Text>
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Icon name="log-in-outline" size={20} color="#fff" />
                <Text style={styles.loginButtonText}>{t('profile.login')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Statistics - First Item */}
        <TouchableOpacity
          style={styles.statisticsCard}
          onPress={() => navigation.navigate('Home', { screen: 'Statistics' })}
          activeOpacity={0.8}
        >
          <View style={styles.statisticsLeft}>
            <View style={styles.statisticsIconWrapper}>
              <Icon name="stats-chart" size={26} color={colors.retroCyan} />
            </View>
            <View>
              <Text style={styles.statisticsTitle}>{t('settings.statistics')}</Text>
              <Text style={styles.statisticsSubtitle}>{t('statistics.today')}, {t('statistics.thisWeek')}, {t('statistics.thisMonth')}</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={24} color={colors.retroCyan} />
        </TouchableOpacity>

        {/* Settings Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleChangeLanguage} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Icon name="language" size={22} color={colors.retroCyan} />
              <Text style={styles.settingText}>{t('settings.nativeLanguage')}</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {(user?.nativeLanguage || settings.nativeLanguage || 'de').toUpperCase()}
              </Text>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Notifications - hidden until implemented
          <TouchableOpacity style={styles.settingItem} onPress={handleNotifications} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Icon name="notifications" size={22} color={colors.retroYellow} />
              <Text style={styles.settingText}>{t('settings.notifications')}</Text>
            </View>
            <View style={styles.settingRight}>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
*/}

          <TouchableOpacity style={styles.settingItem} onPress={toggleHaptic} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Icon name="phone-portrait-outline" size={22} color={colors.retroPurple} />
              <Text style={styles.settingText}>{t('settings.hapticFeedback')}</Text>
            </View>
            <View style={styles.settingRight}>
              <View style={[styles.toggleSwitch, settings.hapticEnabled && styles.toggleSwitchOn]}>
                <View style={[styles.toggleKnob, settings.hapticEnabled && styles.toggleKnobOn]} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.about')}</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleAbout} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Icon name="information-circle" size={22} color={colors.retroCoral} />
              <Text style={styles.settingText}>{t('settings.aboutApp')}</Text>
            </View>
            <View style={styles.settingRight}>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Rate App - hidden until app is published on App Store
          <TouchableOpacity style={styles.settingItem} onPress={handleRateApp} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Icon name="star" size={22} color={colors.retroYellow} />
              <Text style={styles.settingText}>{t('settings.rateApp')}</Text>
            </View>
            <View style={styles.settingRight}>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
*/}

          <TouchableOpacity style={styles.settingItem} onPress={() => setShowAGBModal(true)} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Icon name="document-text" size={22} color={colors.retroCyan} />
              <Text style={styles.settingText}>{t('settings.termsOfService')}</Text>
            </View>
            <View style={styles.settingRight}>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => setShowPrivacyModal(true)} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Icon name="shield-checkmark" size={22} color={colors.retroPurple} />
              <Text style={styles.settingText}>{t('settings.privacyPolicy')}</Text>
            </View>
            <View style={styles.settingRight}>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        {user && (
          <View style={styles.logoutSection}>
            <Button
              title={t('settings.logout')}
              variant="outline"
              onPress={handleLogout}
            />
          </View>
        )}

        {/* Version */}
        <Text style={styles.version}>{t('settings.version')} 1.0.0</Text>
      </ScrollView>

      {/* AGB Modal */}
      <Modal visible={showAGBModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('legal.termsTitle')}</Text>
            <TouchableOpacity onPress={() => setShowAGBModal(false)} style={styles.modalCloseBtn}>
              <Icon name="close" size={24} color={colors.retroDark} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            <Text style={styles.modalHeading}>{t('legal.terms.scope')}</Text>
            <Text style={styles.modalText}>{t('legal.terms.scopeText')}</Text>

            <Text style={styles.modalHeading}>{t('legal.terms.subject')}</Text>
            <Text style={styles.modalText}>{t('legal.terms.subjectText')}</Text>

            <Text style={styles.modalHeading}>{t('legal.terms.rights')}</Text>
            <Text style={styles.modalText}>{t('legal.terms.rightsText')}</Text>

            <Text style={styles.modalHeading}>{t('legal.terms.obligations')}</Text>
            <Text style={styles.modalText}>{t('legal.terms.obligationsText')}</Text>

            <Text style={styles.modalHeading}>{t('legal.terms.liability')}</Text>
            <Text style={styles.modalText}>{t('legal.terms.liabilityText')}</Text>

            <Text style={styles.modalHeading}>{t('legal.terms.changes')}</Text>
            <Text style={styles.modalText}>{t('legal.terms.changesText')}</Text>

            <Text style={styles.modalHeading}>{t('legal.terms.final')}</Text>
            <Text style={styles.modalText}>{t('legal.terms.finalText')}</Text>

            <Text style={styles.modalDate}>{t('legal.lastUpdated')}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal visible={showPrivacyModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('legal.privacyTitle')}</Text>
            <TouchableOpacity onPress={() => setShowPrivacyModal(false)} style={styles.modalCloseBtn}>
              <Icon name="close" size={24} color={colors.retroDark} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            <Text style={styles.modalHeading}>{t('legal.privacy.controller')}</Text>
            <Text style={styles.modalText}>{t('legal.privacy.controllerText')}</Text>

            <Text style={styles.modalHeading}>{t('legal.privacy.dataCollected')}</Text>
            <Text style={styles.modalText}>{t('legal.privacy.dataCollectedText')}</Text>

            <Text style={styles.modalHeading}>{t('legal.privacy.purpose')}</Text>
            <Text style={styles.modalText}>{t('legal.privacy.purposeText')}</Text>

            <Text style={styles.modalHeading}>{t('legal.privacy.sharing')}</Text>
            <Text style={styles.modalText}>{t('legal.privacy.sharingText')}</Text>

            <Text style={styles.modalHeading}>{t('legal.privacy.rights')}</Text>
            <Text style={styles.modalText}>{t('legal.privacy.rightsText')}</Text>

            <Text style={styles.modalHeading}>{t('legal.privacy.security')}</Text>
            <Text style={styles.modalText}>{t('legal.privacy.securityText')}</Text>

            <Text style={styles.modalHeading}>{t('legal.privacy.contact')}</Text>
            <Text style={styles.modalText}>{t('legal.privacy.contactText')}</Text>

            <Text style={styles.modalDate}>{t('legal.lastUpdated')}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.retroCream,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.retroDark,
  },
  profileCard: {
    margin: spacing.md,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.retroPurple,
    overflow: 'hidden',
    shadowColor: colors.retroPurple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  loginCard: {
    margin: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 3,
  },
  statisticsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.retroCyan,
    shadowColor: colors.retroCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statisticsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statisticsIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 188, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.3)',
  },
  statisticsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  statisticsSubtitle: {
    fontSize: 13,
    color: colors.retroCyan,
    marginTop: 4,
    fontWeight: '500',
  },
  loginTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.retroPurple,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cardTopBar: {
    height: 5,
    backgroundColor: colors.retroPurple,
  },
  cardContent: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.retroPurple,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.retroPurple,
    shadowColor: colors.retroPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: colors.retroPurple,
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.retroCyan,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: colors.retroCyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.retroDark,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    gap: 8,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statBadgeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.retroCyan,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.retroBorder,
  },
  section: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: colors.retroCream,
    borderBottomWidth: 1,
    borderBottomColor: colors.retroBorder,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.retroBorder,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.retroDark,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.textMuted,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchOn: {
    backgroundColor: colors.retroCyan,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.retroBorder,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  logoutSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
    backgroundColor: colors.retroCream,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.retroDark,
    flex: 1,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.retroDark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  modalDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xl,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SettingsScreen;
