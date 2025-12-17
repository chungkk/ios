// Playback controls component - play/pause, speed selector

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { PlaybackSpeed } from '../../hooks/useVideoPlayer';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { textStyles } from '../../styles/typography';

interface PlaybackControlsProps {
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  onPlayPause: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
}

const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5];

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  playbackSpeed,
  onPlayPause,
  onSpeedChange,
}) => {
  return (
    <View style={styles.container}>
      {/* Play/Pause Button */}
      <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
        <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>

      {/* Speed Selector */}
      <View style={styles.speedSelector}>
        <Text style={styles.speedLabel}>Speed:</Text>
        {SPEED_OPTIONS.map((speed) => (
          <TouchableOpacity
            key={speed}
            style={[
              styles.speedButton,
              playbackSpeed === speed && styles.speedButtonActive,
            ]}
            onPress={() => onSpeedChange(speed)}
          >
            <Text
              style={[
                styles.speedButtonText,
                playbackSpeed === speed && styles.speedButtonTextActive,
              ]}
            >
              {speed}x
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.borderColor,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  playButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  speedSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  speedButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginRight: spacing.xs,
    borderRadius: borderRadius.small,
    backgroundColor: colors.bgElevated,
  },
  speedButtonActive: {
    backgroundColor: colors.accentBlue,
  },
  speedButtonText: {
    ...textStyles.label,
    color: colors.textSecondary,
    fontSize: 12,
  },
  speedButtonTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});

export default PlaybackControls;
