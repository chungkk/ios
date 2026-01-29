// Playback controls component - 5-button layout matching iOS design

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing } from '../../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

interface PlaybackControlsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onMicrophone?: () => void;
  isRecording?: boolean;
  isProcessing?: boolean;
  hasRecording?: boolean;
  isPlayingRecording?: boolean;
  onPlayRecording?: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  onPrevious,
  onNext,
  onMicrophone,
  isRecording = false,
  isProcessing = false,
  hasRecording = false,
  isPlayingRecording = false,
  onPlayRecording,
}) => {
  const navIconSize = isTablet ? 32 : 24;
  const micIconSize = isTablet ? 44 : 32;
  const replayIconSize = isTablet ? 32 : 24;

  return (
    <View style={styles.container}>
      {/* Previous Sentence */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={onPrevious}
        activeOpacity={0.7}
      >
        <Icon name="chevron-back" size={navIconSize} color={colors.retroDark} />
      </TouchableOpacity>

      {/* Center Controls */}
      <View style={styles.centerControls}>
        {/* Microphone Button */}
        <TouchableOpacity
          style={[
            styles.micButton,
            isRecording && styles.micButtonRecording,
            isProcessing && styles.micButtonProcessing,
          ]}
          onPress={onMicrophone}
          activeOpacity={0.7}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Icon name="hourglass-outline" size={micIconSize} color="#ffffff" />
          ) : isRecording ? (
            <Icon name="stop" size={micIconSize} color="#ffffff" />
          ) : (
            <Icon name="mic" size={micIconSize} color="#ffffff" />
          )}
        </TouchableOpacity>

        {/* Play Recording Button - Only show if has recording */}
        {hasRecording && (
          <TouchableOpacity
            style={[
              styles.replayButton,
              isPlayingRecording && styles.replayButtonPlaying,
            ]}
            onPress={onPlayRecording}
            activeOpacity={0.7}
          >
            <Icon
              name={isPlayingRecording ? 'pause' : 'play'}
              size={replayIconSize}
              color="#ffffff"
              style={isPlayingRecording ? {} : styles.playIconOffset}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Next Sentence */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={onNext}
        activeOpacity={0.7}
      >
        <Icon name="chevron-forward" size={navIconSize} color={colors.retroDark} />
      </TouchableOpacity>
    </View>
  );
};

// Neo-Retro Style
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? spacing.lg : spacing.sm,
    paddingVertical: isTablet ? 8 : 2,
    backgroundColor: colors.retroCream,
    borderTopWidth: 1,
    borderTopColor: colors.retroBorder,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 20 : 14,
  },
  navButton: {
    width: isTablet ? 70 : 50,
    height: isTablet ? 70 : 50,
    borderRadius: isTablet ? 35 : 25,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 2,
  },
  playButton: {
    width: isTablet ? 88 : 64,
    height: isTablet ? 88 : 64,
    borderRadius: isTablet ? 44 : 32,
    backgroundColor: colors.retroCyan,
    borderWidth: 3,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  micButton: {
    width: isTablet ? 88 : 64,
    height: isTablet ? 88 : 64,
    borderRadius: isTablet ? 44 : 32,
    backgroundColor: colors.retroCoral,
    borderWidth: 3,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  micButtonRecording: {
    backgroundColor: '#ff4444',
  },
  micButtonProcessing: {
    backgroundColor: '#999',
  },
  replayButton: {
    width: isTablet ? 60 : 44,
    height: isTablet ? 60 : 44,
    borderRadius: isTablet ? 30 : 22,
    backgroundColor: colors.retroPurple,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 2,
  },
  replayButtonPlaying: {
    backgroundColor: '#7c3aed',
  },
  playIconOffset: {
    marginLeft: 2,
  },
});

export default PlaybackControls;
