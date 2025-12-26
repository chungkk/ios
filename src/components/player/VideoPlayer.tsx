// VideoPlayer component - YouTube player wrapper
// Uses react-native-youtube-bridge

import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { YoutubeView, useYouTubePlayer, useYouTubeEvent, PlayerState } from 'react-native-youtube-bridge';
import type { PlaybackSpeed } from '../../hooks/useVideoPlayer';
import { colors } from '../../styles/theme';

interface VideoPlayerProps {
  videoId: string;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  onReady: () => void;
  onStateChange: (state: string) => void;
  onError: (error: string) => void;
}

export interface VideoPlayerRef {
  getCurrentTime: () => Promise<number>;
  seekTo: (seconds: number) => void;
  getDuration: () => Promise<number>;
  pause: () => void;
  play: () => void;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ videoId, isPlaying, playbackSpeed, onReady, onStateChange, onError }, ref) => {
    const [playerReady, setPlayerReady] = useState(false);

    // Initialize YouTube player with videoId and playsinline option
    const player = useYouTubePlayer(videoId, {
      playsinline: true, // Play inline instead of fullscreen on iOS
      controls: true,
      rel: false,
    });

    console.log('[VideoPlayer] Rendered with isPlaying:', isPlaying);

    // Listen to player ready event
    useYouTubeEvent(player, 'ready', () => {
      setPlayerReady(true);
      onReady();
    });

    // Listen to state change events
    useYouTubeEvent(player, 'stateChange', (state: PlayerState) => {
      onStateChange(state.toString());
    });

    // Listen to error events
    useYouTubeEvent(player, 'error', (error) => {
      onError(error.message);
    });

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
          height={250}
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
    backgroundColor: '#000', // Pure black for video
    overflow: 'hidden',
    height: 250,
  },
  player: {
    alignSelf: 'stretch',
    height: 250,
  },
});

export default VideoPlayer;
