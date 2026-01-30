// Playback controls component - 5-button layout matching iOS design

import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
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

  // Animation values for Pulse + Ripple effects
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleScale = useRef(new Animated.Value(1)).current;
  const rippleOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (isRecording) {
      // Pulse animation - button scales up and down
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );

      // Ripple animation - expanding circle fading out
      const rippleAnimation = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(rippleScale, {
              toValue: 1.6,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(rippleScale, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(rippleOpacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity, {
              toValue: 0.6,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      pulseAnimation.start();
      rippleAnimation.start();

      return () => {
        pulseAnimation.stop();
        rippleAnimation.stop();
        pulseAnim.setValue(1);
        rippleScale.setValue(1);
        rippleOpacity.setValue(0.6);
      };
    } else {
      // Reset animations when not recording
      pulseAnim.setValue(1);
      rippleScale.setValue(1);
      rippleOpacity.setValue(0);
    }
  }, [isRecording, pulseAnim, rippleScale, rippleOpacity]);

  const micButtonSize = isTablet ? 88 : 64;

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
        {/* Microphone Button with Pulse + Ripple */}
        <View style={styles.micButtonContainer}>
          {/* Ripple effect layer - only visible when recording */}
          {isRecording && (
            <Animated.View
              style={[
                styles.rippleEffect,
                {
                  width: micButtonSize,
                  height: micButtonSize,
                  borderRadius: micButtonSize / 2,
                  transform: [{ scale: rippleScale }],
                  opacity: rippleOpacity,
                },
              ]}
            />
          )}

          {/* Main mic button with pulse */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
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
          </Animated.View>
        </View>

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
  micButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rippleEffect: {
    position: 'absolute',
    backgroundColor: '#ff4444',
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
