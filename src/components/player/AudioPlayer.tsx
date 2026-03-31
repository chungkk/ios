// AudioPlayer component - Premium design for audio-only lessons
// Uses @react-native-community/audio-toolkit Player

import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Text, Image, Animated, Platform } from 'react-native';
import { Player } from '@react-native-community/audio-toolkit';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../styles/theme';
import { BASE_URL } from '../../services/api';

interface AudioPlayerProps {
  audioUrl: string;
  thumbnailUrl?: string;
  isPlaying: boolean;
  playbackSpeed: number;
  onReady?: () => void;
  onStateChange?: (state: string) => void;
  onError?: (error: string) => void;
}

export interface AudioPlayerRef {
  getCurrentTime: () => Promise<number>;
  seekTo: (seconds: number) => void;
  getDuration: () => Promise<number>;
  pause: () => void;
  play: () => void;
}

// Animated equalizer bar component
const EqBar = ({ delay, isActive }: { delay: number; isActive: boolean }) => {
  const height = useRef(new Animated.Value(4)).current;
  const activeRef = useRef(false);

  useEffect(() => {
    if (isActive) {
      activeRef.current = true;
      const animate = () => {
        if (!activeRef.current) return;
        Animated.sequence([
          Animated.timing(height, {
            toValue: 8 + Math.random() * 18,
            duration: 200 + Math.random() * 200,
            useNativeDriver: false,
          }),
          Animated.timing(height, {
            toValue: 3 + Math.random() * 6,
            duration: 200 + Math.random() * 200,
            useNativeDriver: false,
          }),
        ]).start(({ finished }) => {
          if (finished && activeRef.current) animate();
        });
      };
      const timeout = setTimeout(animate, delay);
      return () => {
        activeRef.current = false;
        clearTimeout(timeout);
      };
    } else {
      activeRef.current = false;
      height.stopAnimation();
      Animated.timing(height, {
        toValue: 4,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [isActive, delay, height]);

  return (
    <Animated.View
      style={[
        eqStyles.bar,
        {
          height,
          backgroundColor: isActive ? colors.retroCyan : 'rgba(255,255,255,0.25)',
        },
      ]}
    />
  );
};

const eqStyles = StyleSheet.create({
  bar: {
    width: 3,
    borderRadius: 1.5,
    marginHorizontal: 1.5,
  },
});

// Play/Pause button with animated ring
const PlayPauseIndicator = ({ isPlaying }: { isPlaying: boolean }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      const pulse = () => {
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0.5, duration: 600, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 1200, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
        ]).start(() => pulse());
      };
      pulse();
    } else {
      scale.setValue(1);
      ringOpacity.setValue(0);
    }
  }, [isPlaying, scale, ringOpacity]);

  return (
    <View style={ppStyles.playContainer}>
      <Animated.View
        style={[
          ppStyles.pulseRing,
          { transform: [{ scale }], opacity: ringOpacity },
        ]}
      />
      <View style={ppStyles.playButton}>
        <Icon
          name={isPlaying ? 'pause' : 'play'}
          size={22}
          color="#fff"
          style={!isPlaying ? { marginLeft: 2 } : undefined}
        />
      </View>
    </View>
  );
};

const ppStyles = StyleSheet.create({
  playContainer: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.retroCyan,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  ({ audioUrl, thumbnailUrl, isPlaying, playbackSpeed, onReady, onStateChange, onError }, ref) => {
    const playerRef = useRef<Player | null>(null);
    const [playerReady, setPlayerReady] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // === Manual time tracking ===
    // audio-toolkit's player.currentTime is unreliable for remote URLs on iOS.
    // Instead, we track time manually using Date.now().
    // When playing: currentPos = playStartPosition + (now - playStartTimestamp) / 1000 * speed
    const playStartTimestampRef = useRef<number>(0);   // Date.now() when play started
    const playStartPositionRef = useRef<number>(0);     // position (sec) when play started
    const currentPositionRef = useRef<number>(0);       // always up-to-date position
    const playbackSpeedRef = useRef<number>(1);
    const isPlayingRef = useRef<boolean>(false);
    const isSeeking = useRef(false);
    const lastSeekTimestampRef = useRef<number>(0); // Track when last seek happened

    // Keep speed ref in sync
    useEffect(() => {
      playbackSpeedRef.current = playbackSpeed;
    }, [playbackSpeed]);

    // Calculate current position based on manual tracking
    const getManualTime = (): number => {
      if (isPlayingRef.current && playStartTimestampRef.current > 0) {
        const elapsed = (Date.now() - playStartTimestampRef.current) / 1000;
        return playStartPositionRef.current + elapsed * playbackSpeedRef.current;
      }
      return currentPositionRef.current;
    };

    // Build full audio URL
    const fullAudioUrl = audioUrl.startsWith('http')
      ? audioUrl
      : `${BASE_URL}${audioUrl}`;

    // Initialize player
    useEffect(() => {
      if (__DEV__) console.log('[AudioPlayer] Initializing with URL:', fullAudioUrl);

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      const player = new Player(fullAudioUrl, {
        autoDestroy: false,
        continuesToPlayInBackground: true,
      });

      playerRef.current = player;

      player.prepare((err) => {
        if (err) {
          if (__DEV__) console.error('[AudioPlayer] Prepare error:', err);
          onError?.(typeof err === 'string' ? err : JSON.stringify(err));
          return;
        }

        const rawDuration = player.duration || 0;
        const durationSec = rawDuration > 0 ? rawDuration / 1000 : 0;
        if (__DEV__) console.log('[AudioPlayer] Player ready, raw duration:', rawDuration, 'sec:', durationSec);
        setPlayerReady(true);
        setDuration(durationSec);
        onReady?.();
        onStateChange?.('ready');
      });

      // @ts-ignore
      player.on('ended', () => {
        if (__DEV__) console.log('[AudioPlayer] Playback ended');
        isPlayingRef.current = false;
        onStateChange?.('ended');
      });

      return () => {
        if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
        setPlayerReady(false);
        isPlayingRef.current = false;
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fullAudioUrl]);

    // Control playback + manual time tracking
    useEffect(() => {
      if (!playerRef.current || !playerReady) return;

      if (isPlaying) {
        // Record play start for manual tracking
        playStartPositionRef.current = currentPositionRef.current;
        playStartTimestampRef.current = Date.now();
        isPlayingRef.current = true;

        playerRef.current.play((err) => {
          if (err) {
            if (__DEV__) console.error('[AudioPlayer] Play error:', err);
            isPlayingRef.current = false;
            return;
          }
          // NOTE: Do NOT call onStateChange('1') here.
          // AudioPlayer is a controlled component - isPlaying prop is the source of truth.
          // Calling onStateChange('1') would trigger setIsPlayingFromYouTube(true) in LessonScreen
          // which has debounce logic designed for YouTube and can cause conflicts.
          if (__DEV__) console.log('[AudioPlayer] Play started successfully');
        });

        // Start UI time tracking interval
        timeIntervalRef.current = setInterval(() => {
          if (!isSeeking.current) {
            const t = getManualTime();
            setCurrentTime(t);
            currentPositionRef.current = t;

            // Also try to sync with native player time if available
            // IMPORTANT: Skip recalibration for 2s after a seek - native player
            // lags behind on remote URLs and would overwrite the correct seek position,
            // causing auto-stop to re-trigger immediately.
            const timeSinceLastSeek = Date.now() - lastSeekTimestampRef.current;
            if (playerRef.current && timeSinceLastSeek > 2000) {
              const nativeTime = playerRef.current.currentTime;
              if (nativeTime > 0) {
                const nativeSec = nativeTime / 1000;
                // If native time differs by more than 1s, recalibrate
                if (Math.abs(nativeSec - t) > 1) {
                  if (__DEV__) console.log('[AudioPlayer] Recalibrating: manual=', t.toFixed(2), 'native=', nativeSec.toFixed(2));
                  currentPositionRef.current = nativeSec;
                  playStartPositionRef.current = nativeSec;
                  playStartTimestampRef.current = Date.now();
                  setCurrentTime(nativeSec);
                }
              }
              // Update duration if initially unknown
              const dur = playerRef.current.duration;
              if (dur > 0 && duration <= 0) {
                setDuration(dur / 1000);
              }
            }
          }
        }, 100);
      } else {
        // Pause: freeze manual time
        const frozenTime = getManualTime();
        currentPositionRef.current = frozenTime;
        isPlayingRef.current = false;
        playStartTimestampRef.current = 0;

        playerRef.current.pause();
        // NOTE: Do NOT call onStateChange('2') here.
        // Same reason as above: AudioPlayer is controlled by isPlaying prop.
        if (__DEV__) console.log('[AudioPlayer] Paused at:', frozenTime.toFixed(2), 'sec');

        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
          timeIntervalRef.current = null;
        }
      }

      return () => {
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
          timeIntervalRef.current = null;
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, playerReady]);

    // Playback speed
    useEffect(() => {
      if (playerRef.current && playerReady) {
        // When speed changes while playing, recalibrate manual tracker
        if (isPlayingRef.current) {
          const currentPos = getManualTime();
          currentPositionRef.current = currentPos;
          playStartPositionRef.current = currentPos;
          playStartTimestampRef.current = Date.now();
        }
        try {
          // @ts-ignore
          playerRef.current.speed = playbackSpeed;
        } catch (e) {
          if (__DEV__) console.log('[AudioPlayer] Speed not supported:', e);
        }
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playbackSpeed, playerReady]);

    useImperativeHandle(ref, () => ({
      getCurrentTime: async () => {
        if (isSeeking.current) {
          return currentPositionRef.current;
        }
        const t = getManualTime();
        currentPositionRef.current = t;
        return t;
      },
      seekTo: (seconds: number) => {
        if (playerRef.current && playerReady) {
          if (__DEV__) console.log('[AudioPlayer] seekTo:', seconds);
          isSeeking.current = true;
          lastSeekTimestampRef.current = Date.now();

          // Update manual tracking immediately
          currentPositionRef.current = seconds;
          playStartPositionRef.current = seconds;
          playStartTimestampRef.current = Date.now();
          setCurrentTime(seconds);

          playerRef.current.seek(seconds * 1000, () => {
            if (__DEV__) console.log('[AudioPlayer] Seek complete to:', seconds);
            isSeeking.current = false;
          });

          // Safety timeout
          setTimeout(() => {
            isSeeking.current = false;
          }, 500);
        }
      },
      getDuration: async () => {
        if (playerRef.current && playerReady) {
          const dur = playerRef.current.duration || 0;
          return dur > 0 ? dur / 1000 : 0;
        }
        return 0;
      },
      pause: () => {
        if (playerRef.current && playerReady) {
          const frozenTime = getManualTime();
          currentPositionRef.current = frozenTime;
          isPlayingRef.current = false;
          playStartTimestampRef.current = 0;
          playerRef.current.pause();
        }
      },
      play: () => {
        if (playerRef.current && playerReady) {
          playStartPositionRef.current = currentPositionRef.current;
          playStartTimestampRef.current = Date.now();
          isPlayingRef.current = true;
          playerRef.current.play();
        }
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [playerReady]);

    // Format time - guard against negative values
    const formatTime = (secs: number): string => {
      if (!secs || secs < 0 || !isFinite(secs)) return '00:00';
      const mins = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
    const remaining = duration > 0 ? Math.max(duration - currentTime, 0) : 0;

    // Generate equalizer bar delays
    const EQ_BARS = 16;
    const barDelays = useRef(
      Array.from({ length: EQ_BARS }, (_, i) => i * 60 + Math.random() * 100)
    ).current;

    return (
      <View style={styles.container}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.bgImage} resizeMode="cover" />
        ) : null}

        <View style={styles.gradientOverlay} />

        <View style={styles.content}>
          <PlayPauseIndicator isPlaying={isPlaying} />

          <View style={styles.eqContainer}>
            {barDelays.map((delay, i) => (
              <EqBar key={i} delay={delay} isActive={isPlaying} />
            ))}
          </View>

          <View style={styles.progressSection}>
            <View style={styles.timeRow}>
              <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
              <Text style={styles.remainingTime}>
                {duration > 0 ? `-${formatTime(remaining)}` : '--:--'}
              </Text>
            </View>

            <View style={styles.trackContainer}>
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: `${progress}%` }]} />
              </View>
              {duration > 0 && (
                <View style={[styles.knob, { left: `${progress}%` }]} />
              )}
            </View>
          </View>

          <View style={styles.labelRow}>
            <View style={styles.badge}>
              <Icon name="headset-outline" size={11} color={colors.retroCyan} />
              <Text style={styles.badgeText}>Audio Lesson</Text>
            </View>
            {playerReady && (
              <View style={styles.badge}>
                <Icon name="checkmark-circle" size={11} color="#4ade80" />
                <Text style={[styles.badgeText, { color: '#4ade80' }]}>Ready</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    position: 'relative',
    overflow: 'hidden',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.15,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 15, 26, 0.6)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  eqContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 28,
    marginTop: 4,
  },
  progressSection: {
    width: '85%',
    maxWidth: 320,
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  currentTime: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
    letterSpacing: 0.5,
  },
  remainingTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
    letterSpacing: 0.5,
  },
  trackContainer: {
    position: 'relative',
    height: 20,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: colors.retroCyan,
    borderRadius: 2,
    shadowColor: colors.retroCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  knob: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    marginLeft: -7,
    top: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  labelRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 5,
  },
  badgeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default AudioPlayer;
