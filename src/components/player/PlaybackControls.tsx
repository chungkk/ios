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
  onRepeat?: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  onMicrophone,
  onRepeat,
}) => {
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
        onPress={onPlayPause}
        activeOpacity={0.8}
      >
        <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>

      {/* Microphone Button */}
      <TouchableOpacity 
        style={styles.micButton}
        onPress={onMicrophone}
        activeOpacity={0.7}
      >
        <Text style={styles.micButtonText}>🎤</Text>
      </TouchableOpacity>

      {/* Next Sentence */}
      <TouchableOpacity 
        style={styles.navButton}
        onPress={onNext}
        activeOpacity={0.7}
      >
        <Text style={styles.navButtonText}>›</Text>
      </TouchableOpacity>

      {/* Repeat/Loop Button */}
      <TouchableOpacity 
        style={styles.repeatButton}
        onPress={onRepeat}
        activeOpacity={0.7}
      >
        <Text style={styles.repeatButtonText}>N</Text>
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
    paddingVertical: spacing.lg,
    backgroundColor: '#0a0f1e',
    borderTopWidth: 0,
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 40,
    color: '#ffffff',
    fontWeight: '200',
    marginTop: -4, // Optical alignment
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    fontSize: 28,
    color: '#ffffff',
    marginLeft: 3, // Optical alignment for play icon
  },
  micButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#c41e3a', // Dark red
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonText: {
    fontSize: 24,
  },
  repeatButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  repeatButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default PlaybackControls;
