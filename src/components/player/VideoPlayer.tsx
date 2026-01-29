// VideoPlayer component - YouTube player wrapper
// Uses react-native-youtube-bridge

import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { YoutubeView, useYouTubePlayer, useYouTubeEvent, PlayerState } from 'react-native-youtube-bridge';
import type { PlaybackSpeed } from '../../hooks/useVideoPlayer';

interface VideoPlayerProps {
  videoId: string;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  onReady?: () => void;
  onStateChange?: (state: string) => void;
  onError?: (error: string) => void;
}

export interface VideoPlayerRef {
  getCurrentTime: () => Promise<number>;
  seekTo: (seconds: number) => void;
  getDuration: () => Promise<number>;
  pause: () => void;
  play: () => void;
}

const MAX_ERROR_RETRIES = 3;
const ERROR_RETRY_DELAY = 1000; // 1 second

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ videoId, isPlaying, playbackSpeed, onReady, onStateChange, onError }, ref) => {
    const [playerReady, setPlayerReady] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [shouldRetry, setShouldRetry] = useState(false);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize YouTube player with videoId and playsinline option
    const player = useYouTubePlayer(videoId, {
      playsinline: true, // Play inline instead of fullscreen on iOS
      controls: false, // Hide YouTube controls (volume, play button)
      rel: false,
    });

    if (__DEV__) console.log('[VideoPlayer] Rendered with isPlaying:', isPlaying);

    // Listen to player ready event
    useYouTubeEvent(player, 'ready', () => {
      setPlayerReady(true);
      setRetryCount(0); // Reset retry count on successful load
      onReady?.();
    });

    // Listen to state change events
    useYouTubeEvent(player, 'stateChange', (state: PlayerState) => {
      onStateChange?.(state.toString());
    });

    // Listen to error events with retry mechanism
    useYouTubeEvent(player, 'error', (error) => {
      if (__DEV__) console.error('[VideoPlayer] Error:', error.message, 'Retry count:', retryCount);

      if (retryCount < MAX_ERROR_RETRIES) {
        // Schedule retry with exponential backoff
        const delay = ERROR_RETRY_DELAY * Math.pow(2, retryCount);
        if (__DEV__) console.log('[VideoPlayer] Scheduling retry in', delay, 'ms');

        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          setShouldRetry(true);
        }, delay);
      } else {
        // Max retries reached, notify user
        onError?.(error.message);
        Alert.alert(
          'Video Error',
          'Failed to load video after multiple attempts. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    });

    // Cleanup retry timeout on unmount
    useEffect(() => {
      return () => {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
      };
    }, []);

    // Handle retry
    useEffect(() => {
      if (shouldRetry) {
        setShouldRetry(false);
        setPlayerReady(false);
        // Player will reinitialize with the same videoId
      }
    }, [shouldRetry]);

    // Control playback when isPlaying changes
    useEffect(() => {
      if (player && playerReady) {
        if (isPlaying) {
          player.play();
        } else {
          player.pause();
        }
      }
    }, [isPlaying, playerReady, player]);

    // Set playback speed when it changes
    useEffect(() => {
      if (player && playerReady) {
        player.setPlaybackRate(playbackSpeed);
      }
    }, [playbackSpeed, playerReady, player]);

    useImperativeHandle(ref, () => ({
      getCurrentTime: async () => {
        if (player && playerReady) {
          try {
            const time = await player.getCurrentTime();
            return time || 0;
          } catch {
            return 0;
          }
        }
        return 0;
      },
      seekTo: (seconds: number) => {
        if (player && playerReady) {
          player.seekTo(seconds, true);
        }
      },
      getDuration: async () => {
        if (player && playerReady) {
          try {
            const duration = await player.getDuration();
            return duration || 0;
          } catch {
            return 0;
          }
        }
        return 0;
      },
      pause: () => {
        if (player && playerReady) {
          player.pause();
        }
      },
      play: () => {
        if (player && playerReady) {
          player.play();
        }
      },
    }), [playerReady, player]);

    return (
      <View style={styles.container}>
        <YoutubeView
          player={player}
          style={styles.player}
          webViewProps={{
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
          }}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Pure black for video
    overflow: 'hidden',
  },
  player: {
    flex: 1,
    alignSelf: 'stretch',
  },
});

export default VideoPlayer;
