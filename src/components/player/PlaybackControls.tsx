// Playback controls component - play/pause, speed selector

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../styles/theme';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onPlayPause,
}) => {
  return (
    <View style={styles.container}>
      {/* Center: Navigation, Mic, and Play controls */}
      <View style={styles.centerControls}>
        {/* Previous */}
        <TouchableOpacity style={styles.navButton}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>

        {/* Microphone Button */}
        <TouchableOpacity style={styles.micButton}>
          <Text style={styles.micButtonText}>🎤</Text>
        </TouchableOpacity>

        {/* Play/Pause Button */}
        <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
          <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity style={styles.navButton}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Right: Menu */}
      <TouchableOpacity style={styles.menuButton}>
        <Text style={styles.menuButtonText}>⋮</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.borderColor,
  },
  centerControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 32,
    color: colors.textPrimary,
    fontWeight: '300',
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonText: {
    fontSize: 20,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 24,
    color: colors.textPrimary,
    marginLeft: 2,
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '700',
  },
});

export default PlaybackControls;
