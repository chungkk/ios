// SettingsMenu - Dropdown menu for lesson settings
// Migrated from ppgeil DictationHeader settings dropdown

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface SettingsMenuProps {
  visible: boolean;
  onClose: () => void;
  
  // Speed control
  playbackSpeed: number;
  onSpeedPress: () => void;
  
  // Auto-stop control
  autoStop: boolean;
  onAutoStopToggle: () => void;
  
  // Translation control
  showTranslation: boolean;
  onTranslationToggle: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  visible,
  onClose,
  playbackSpeed,
  onSpeedPress,
  autoStop,
  onAutoStopToggle,
  showTranslation,
  onTranslationToggle,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          {/* Translation Toggle */}
          <TouchableOpacity
            style={[styles.menuItem, showTranslation && styles.menuItemActive]}
            onPress={onTranslationToggle}
            activeOpacity={0.7}
          >
            <Icon name="language-outline" size={24} color={colors.textPrimary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Hiện dịch</Text>
            <View style={styles.toggle}>
              <View style={[styles.toggleTrack, showTranslation && styles.toggleTrackActive]}>
                <View style={[styles.toggleThumb, showTranslation && styles.toggleThumbActive]} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Speed Control */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onSpeedPress}
            activeOpacity={0.7}
          >
            <Icon name="speedometer-outline" size={24} color={colors.textPrimary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Tốc độ</Text>
            <Text style={styles.menuValue}>{playbackSpeed}x</Text>
          </TouchableOpacity>

          {/* Auto-stop Toggle */}
          <TouchableOpacity
            style={[styles.menuItem, autoStop && styles.menuItemActive]}
            onPress={onAutoStopToggle}
            activeOpacity={0.7}
          >
            <Icon name="pause-outline" size={24} color={colors.textPrimary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Auto stop</Text>
            <View style={styles.toggle}>
              <View style={[styles.toggleTrack, autoStop && styles.toggleTrackActive]}>
                <View style={[styles.toggleThumb, autoStop && styles.toggleThumbActive]} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 95, // Below sentence counter + settings button
    paddingRight: spacing.md,
  },
  menuContainer: {
    backgroundColor: '#1a2235',
    borderRadius: borderRadius.large,
    minWidth: 220,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  menuItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  menuIcon: {
    width: 28,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  menuValue: {
    fontSize: 15,
    color: colors.accentBlue,
    fontWeight: '600',
  },
  toggle: {
    padding: spacing.xs,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: colors.accentBlue,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});

export default SettingsMenu;
