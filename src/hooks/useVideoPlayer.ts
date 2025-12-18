// Custom hook for video player state management
// Fixed: Debounce YouTube state changes to prevent race conditions

import { useState, useCallback, useRef } from 'react';

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

interface UseVideoPlayerResult {
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  currentTime: number;
  duration: number;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  togglePlayPause: () => void;
  setIsPlayingFromYouTube: (playing: boolean) => void; // For YouTube event handler
  playerRef: React.MutableRefObject<any>;
}

const DEBOUNCE_MS = 300; // Ignore YouTube events within 300ms of user action

export const useVideoPlayer = (): UseVideoPlayerResult => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<any>(null);
  const lastUserActionTime = useRef<number>(0);

  const togglePlayPause = useCallback(() => {
    console.log('[useVideoPlayer] User toggled play/pause:', !isPlaying);
    lastUserActionTime.current = Date.now();
    setIsPlaying(prev => !prev);
  }, [isPlaying]);

  // Separate handler for YouTube state changes to prevent race conditions
  const setIsPlayingFromYouTube = useCallback((playing: boolean) => {
    const timeSinceUserAction = Date.now() - lastUserActionTime.current;
    
    if (timeSinceUserAction < DEBOUNCE_MS) {
      console.log('[useVideoPlayer] Ignoring YouTube event (too soon after user action):', playing);
      return; // Ignore YouTube events shortly after user action
    }
    
    console.log('[useVideoPlayer] YouTube state changed:', playing);
    setIsPlaying(playing);
  }, []);

  return {
    isPlaying,
    playbackSpeed,
    currentTime,
    duration,
    setIsPlaying,
    setPlaybackSpeed,
    setCurrentTime,
    setDuration,
    togglePlayPause,
    setIsPlayingFromYouTube,
    playerRef,
  };
};

export default useVideoPlayer;
