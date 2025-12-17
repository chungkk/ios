// Custom hook for video player state management

import { useState, useCallback, useRef } from 'react';

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5;

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
  playerRef: React.MutableRefObject<any>;
}

export const useVideoPlayer = (): UseVideoPlayerResult => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<any>(null);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
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
    playerRef,
  };
};

export default useVideoPlayer;
