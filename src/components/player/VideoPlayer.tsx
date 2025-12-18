// VideoPlayer component - YouTube iframe player wrapper
// Uses react-native-youtube-iframe

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
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
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ videoId, isPlaying, playbackSpeed, onReady, onStateChange, onError }, ref) => {
    const [playerReady, setPlayerReady] = useState(false);
    const playerRef = React.useRef<any>(null);

    useImperativeHandle(ref, () => ({
      getCurrentTime: async () => {
        if (playerRef.current && playerReady) {
          try {
            const time = await playerRef.current.getCurrentTime();
            return time || 0;
          } catch (error) {
            console.error('[VideoPlayer] Error getting current time:', error);
            return 0;
          }
        }
        return 0;
      },
      seekTo: (seconds: number) => {
        if (playerRef.current && playerReady) {
          playerRef.current.seekTo(seconds, true);
        }
      },
      getDuration: async () => {
        if (playerRef.current && playerReady) {
          try {
            const duration = await playerRef.current.getDuration();
            return duration || 0;
          } catch (error) {
            console.error('[VideoPlayer] Error getting duration:', error);
            return 0;
          }
        }
        return 0;
      },
    }));

    const handleReady = () => {
      setPlayerReady(true);
      onReady();
    };

    return (
      <View style={styles.container}>
        <YoutubePlayer
          ref={playerRef}
          videoId={videoId}
          height={250}
          play={isPlaying}
          rate={playbackSpeed}
          onReady={handleReady}
          onChangeState={onStateChange}
          onError={onError}
          webViewProps={{
            androidLayerType: 'hardware',
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
  },
});

export default VideoPlayer;
