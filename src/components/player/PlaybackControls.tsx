// Playback controls component - 5-button layout matching iOS design

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
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
  React.useEffect(() => {
    console.log('[PlaybackControls] isPlaying:', isPlaying);
  }, [isPlaying]);

  const handlePlayPause = () => {
    console.log('[PlaybackControls] Play/Pause button pressed');
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
        <Text style={styles.navButtonText}>‹</Text>
      </TouchableOpacity>

      {/* Play/Pause Button - Large Center */}
      <TouchableOpacity 
        style={styles.playButton} 
        onPress={handlePlayPause}
        activeOpacity={0.8}
      >
        <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
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
          <Text style={styles.micButtonText}>⏳</Text>
        ) : isRecording ? (
          <Text style={styles.micButtonText}>⏹</Text>
        ) : (
          <Text style={styles.micButtonText}>🎤</Text>
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
          <Text style={styles.replayButtonText}>
            {isPlayingRecording ? '⏸' : '▶️'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Next Sentence */}
      <TouchableOpacity 
        style={styles.navButton}
        onPress={onNext}
        activeOpacity={0.7}
      >
        <Text style={styles.navButtonText}>›</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#0a0f1e',
    borderTopWidth: 0,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 36,
    color: '#ffffff',
    fontWeight: '200',
    marginTop: -3, // Optical alignment
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2d5cde', // Blue matching play buttons
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2d5cde',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playButtonText: {
    fontSize: 26,
    color: '#ffffff',
    marginLeft: 3, // Optical alignment for play icon
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#c41e3a', // Dark red
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonRecording: {
    backgroundColor: '#ff3333', // Bright red when recording
  },
  micButtonProcessing: {
    backgroundColor: '#666666', // Gray when processing
  },
  micButtonText: {
    fontSize: 22,
  },
  replayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4a9eff', // Blue for playback
    justifyContent: 'center',
    alignItems: 'center',
  },
  replayButtonPlaying: {
    backgroundColor: '#2d7acc', // Darker blue when playing
  },
  replayButtonText: {
    fontSize: 22,
  },
});

export default PlaybackControls;
