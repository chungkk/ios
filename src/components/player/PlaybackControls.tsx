// Playback controls component - 5-button layout matching iOS design

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing } from '../../styles/theme';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
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
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  onMicrophone,
  isRecording = false,
  isProcessing = false,
  hasRecording = false,
  isPlayingRecording = false,
  onPlayRecording,
}) => {
  const handlePlayPause = () => {
    onPlayPause();
  };

  return (
    <View style={styles.container}>
      {/* Previous Sentence */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={onPrevious}
        activeOpacity={0.7}
      >
        <Icon name="chevron-back" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Play/Pause Button - Large Center */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={handlePlayPause}
        activeOpacity={0.8}
      >
        <Icon
          name={isPlaying ? 'pause' : 'play'}
          size={32}
          color="#ffffff"
          style={isPlaying ? {} : { marginLeft: 3 }}
        />
      </TouchableOpacity>

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
          <Icon name="hourglass-outline" size={24} color="#ffffff" />
        ) : isRecording ? (
          <Icon name="stop" size={24} color="#ffffff" />
        ) : (
          <Icon name="mic" size={24} color="#ffffff" />
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
            size={24}
            color="#ffffff"
            style={isPlayingRecording ? {} : { marginLeft: 2 }}
          />
        </TouchableOpacity>
      )}

      {/* Next Sentence */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={onNext}
        activeOpacity={0.7}
      >
        <Icon name="chevron-forward" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

// Neo-Retro Style
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.retroCream,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    width: 60,
    height: 60,
    borderRadius: 30,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.retroCoral,
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
  micButtonRecording: {
    backgroundColor: '#ff4444',
  },
  micButtonProcessing: {
    backgroundColor: '#999',
  },
  replayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
});

export default PlaybackControls;
