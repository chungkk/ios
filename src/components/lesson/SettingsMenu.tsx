// SettingsMenu - Neo-Retro Dropdown menu for lesson settings

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing } from '../../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const iconSize = isTablet ? 28 : 20;

interface SettingsMenuProps {
  visible: boolean;
  onClose: () => void;

  // Speed control
  playbackSpeed: number;
  onSpeedCycle: () => void;

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
  onSpeedCycle,
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
          {/* Top accent bar */}
          <View style={styles.topBar} />

          {/* Translation Toggle */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onTranslationToggle}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.retroCyan }]}>
              <Icon name="language-outline" size={iconSize} color={colors.retroDark} />
            </View>
            <Text style={styles.menuText}>Hiện dịch</Text>
            <View style={styles.toggle}>
              <View style={[styles.toggleTrack, showTranslation && styles.toggleTrackActive]}>
                <View style={[styles.toggleThumb, showTranslation && styles.toggleThumbActive]} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Speed Control - tap to cycle */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onSpeedCycle}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.retroPink }]}>
              <Icon name="speedometer-outline" size={iconSize} color={colors.retroDark} />
            </View>
            <Text style={styles.menuText}>Tốc độ</Text>
            <View style={styles.speedBadge}>
              <Text style={styles.speedValue}>{playbackSpeed}x</Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Auto-stop Toggle */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onAutoStopToggle}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.retroYellow }]}>
              <Icon name="pause-outline" size={iconSize} color={colors.retroDark} />
            </View>
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
    paddingTop: isTablet ? 120 : 95,
    paddingRight: isTablet ? spacing.lg : spacing.md,
  },
  menuContainer: {
    backgroundColor: colors.retroCream,
    borderRadius: isTablet ? 24 : 16,
    minWidth: isTablet ? 340 : 240,
    paddingVertical: isTablet ? spacing.lg : spacing.md,
    borderWidth: 3,
    borderColor: colors.retroBorder,
    // Neo-retro shadow
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 8,
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: isTablet ? 6 : 4,
    backgroundColor: colors.retroCoral,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isTablet ? spacing.lg : spacing.md,
    paddingVertical: isTablet ? spacing.md : spacing.sm,
    gap: isTablet ? spacing.lg : spacing.md,
  },
  iconContainer: {
    width: isTablet ? 48 : 36,
    height: isTablet ? 48 : 36,
    borderRadius: isTablet ? 14 : 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.retroBorder,
    // Shadow
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 2,
  },
  menuText: {
    flex: 1,
    fontSize: isTablet ? 20 : 15,
    color: colors.retroDark,
    fontWeight: '700',
  },
  divider: {
    height: 2,
    backgroundColor: colors.retroBorder,
    marginHorizontal: isTablet ? spacing.lg : spacing.md,
    marginVertical: isTablet ? spacing.sm : spacing.xs,
    opacity: 0.15,
  },
  speedBadge: {
    backgroundColor: colors.retroPurple,
    paddingHorizontal: isTablet ? 18 : 12,
    paddingVertical: isTablet ? 10 : 6,
    borderRadius: isTablet ? 14 : 10,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    // Shadow
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 2,
  },
  speedValue: {
    fontSize: isTablet ? 18 : 14,
    color: '#ffffff',
    fontWeight: '800',
  },
  toggle: {
    padding: spacing.xs,
  },
  toggleTrack: {
    width: isTablet ? 60 : 48,
    height: isTablet ? 36 : 28,
    borderRadius: isTablet ? 18 : 14,
    backgroundColor: '#dfe6e9',
    justifyContent: 'center',
    paddingHorizontal: isTablet ? 4 : 3,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  toggleTrackActive: {
    backgroundColor: colors.retroCyan,
  },
  toggleThumb: {
    width: isTablet ? 26 : 20,
    height: isTablet ? 26 : 20,
    borderRadius: isTablet ? 13 : 10,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: colors.retroBorder,
    // Shadow
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});

export default SettingsMenu;
