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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/common/Loading';
import Button from '../components/common/Button';
import { colors, spacing } from '../styles/theme';
import { BASE_URL } from '../services/api';

const SettingsScreen: React.FC = () => {
  const { user, loading, userPoints, logout, refreshUser } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

      const token = await require('../services/storage.service').getAuthToken();
      const response = await fetch(`${BASE_URL}/api/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        await refreshUser();
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
  }, [refreshUser]);

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
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  }, [logout]);

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
          <Text style={styles.headerTitle}>⚙️ Settings</Text>
        </View>

        {/* Profile Card */}
        {user && (
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
                  <Icon name="camera" size={12} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.userName}>{user.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              
              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userPoints || 0}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{streakValue}</Text>
                  <Text style={styles.statLabel}>Streak</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Settings Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="language" size={22} color={colors.retroCyan} />
              <Text style={styles.settingText}>Native Language</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {(user?.nativeLanguage || 'vi').toUpperCase()}
              </Text>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="school" size={22} color={colors.retroPurple} />
              <Text style={styles.settingText}>Learning Level</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {user?.level || 'Beginner'}
              </Text>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="notifications" size={22} color={colors.retroYellow} />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <View style={styles.settingRight}>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="information-circle" size={22} color={colors.retroCoral} />
              <Text style={styles.settingText}>About App</Text>
            </View>
            <View style={styles.settingRight}>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="star" size={22} color={colors.retroYellow} />
              <Text style={styles.settingText}>Rate App</Text>
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
              title="Logout"
              variant="outline"
              onPress={handleLogout}
            />
          </View>
        )}

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
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
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.retroCream,
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.retroDark,
  },
  profileCard: {
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
  cardTopBar: {
    height: 4,
    backgroundColor: colors.retroCyan,
  },
  cardContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.retroPurple,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.retroBorder,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: colors.retroBorder,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.retroCyan,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.retroDark,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default SettingsScreen;
