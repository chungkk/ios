// ModeSelectionPopup - Neo-Retro Design
// Let user choose between Shadowing and Dictation mode

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { colors, spacing } from '../../styles/theme';
import type { Lesson } from '../../types/lesson.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

export type LessonMode = 'shadowing' | 'dictation';

interface ModeSelectionPopupProps {
  visible: boolean;
  lesson: Lesson | null;
  onClose: () => void;
  onSelectMode: (mode: LessonMode) => void;
}

const formatStudyTime = (seconds: number): string => {
  if (!seconds || seconds === 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${secs}s`;
  }
};

export const ModeSelectionPopup: React.FC<ModeSelectionPopupProps> = ({
  visible,
  lesson,
  onClose,
  onSelectMode,
}) => {
  const modes = [
    {
      id: 'shadowing' as LessonMode,
      name: 'SHADOWING',
      icon: '🗣️',
      description: 'Listen and repeat along with the video',
      studyTime: (lesson as any)?.shadowStudyTime || 0,
      bgColor: '#e0f7fa',
      iconBg: colors.retroCyan,
    },
    {
      id: 'dictation' as LessonMode,
      name: 'DICTATION',
      icon: '✍️',
      description: 'Write down what you hear',
      studyTime: (lesson as any)?.dictationStudyTime || 0,
      bgColor: '#fce4ec',
      iconBg: colors.retroCoral,
    },
  ];

  if (!visible || !lesson) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.popup}>
          {/* Gradient top bar */}
          <View style={styles.topBar} />

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.popupTitle}>Choose Mode</Text>

          {/* Lesson info */}
          <View style={styles.lessonInfo}>
            <Text style={styles.lessonTitle} numberOfLines={2}>
              {lesson?.title}
            </Text>
          </View>

          {/* Mode options */}
          <View style={styles.modesContainer}>
            {modes.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[styles.modeOption, { backgroundColor: mode.bgColor }]}
                onPress={() => onSelectMode(mode.id)}
                activeOpacity={0.9}
              >
                {/* Icon */}
                <View style={[styles.modeIcon, { backgroundColor: mode.iconBg }]}>
                  <Text style={styles.modeIconText}>{mode.icon}</Text>
                </View>

                {/* Name */}
                <Text style={styles.modeName}>{mode.name}</Text>

                {/* Description */}
                <Text style={styles.modeDescription}>{mode.description}</Text>

                {/* Study time */}
                <View style={styles.modeStudyTime}>
                  <Text style={styles.studyTimeIcon}>⏱️</Text>
                  <Text style={styles.studyTimeText}>
                    {formatStudyTime(mode.studyTime)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  popup: {
    backgroundColor: colors.retroCream,
    borderRadius: isTablet ? 28 : 20,
    padding: isTablet ? 32 : 20,
    width: '100%',
    maxWidth: isTablet ? 600 : 400,
    borderWidth: 3,
    borderColor: colors.retroBorder,
    // Shadow
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 10,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    backgroundColor: colors.retroCoral,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    // Shadow
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 2,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.retroDark,
  },
  popupTitle: {
    fontSize: isTablet ? 28 : 22,
    fontWeight: '900',
    color: colors.retroPurple,
    textAlign: 'center',
    marginBottom: isTablet ? spacing.lg : spacing.md,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lessonInfo: {
    backgroundColor: '#ffffff',
    borderRadius: isTablet ? 16 : 12,
    padding: isTablet ? 18 : 12,
    marginBottom: isTablet ? spacing.lg : spacing.md,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    // Shadow
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 2,
  },
  lessonTitle: {
    fontSize: isTablet ? 18 : 14,
    fontWeight: '700',
    color: colors.retroDark,
    lineHeight: isTablet ? 26 : 20,
  },
  modesContainer: {
    flexDirection: 'row',
    gap: isTablet ? 20 : 12,
  },
  modeOption: {
    flex: 1,
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 24 : 14,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    alignItems: 'center',
    // Shadow
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 3,
  },
  modeIcon: {
    width: isTablet ? 64 : 44,
    height: isTablet ? 64 : 44,
    borderRadius: isTablet ? 16 : 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isTablet ? 16 : 10,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    // Shadow
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 2,
  },
  modeIconText: {
    fontSize: isTablet ? 32 : 22,
  },
  modeName: {
    fontSize: isTablet ? 18 : 14,
    fontWeight: '800',
    color: colors.retroDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: isTablet ? 10 : 6,
  },
  modeDescription: {
    fontSize: isTablet ? 14 : 11,
    color: '#636e72',
    textAlign: 'center',
    lineHeight: isTablet ? 20 : 15,
    marginBottom: isTablet ? 16 : 10,
  },
  modeStudyTime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.retroYellow,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.retroBorder,
    // Shadow
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 1,
  },
  studyTimeIcon: {
    fontSize: 12,
  },
  studyTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.retroDark,
    fontFamily: 'Courier',
  },
});

export default ModeSelectionPopup;
