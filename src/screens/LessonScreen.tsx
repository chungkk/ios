// LessonScreen - Video player with synchronized transcript
// Migrated from ppgeil/pages/[lessonId].js and ppgeil/pages/dictation/[lessonId].js

import React, { useRef, useState, useCallback, useLayoutEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Alert, Text, TouchableOpacity } from 'react-native';
import { useLessonData } from '../hooks/useLessonData';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useTranscriptSync } from '../hooks/useTranscriptSync';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import VideoPlayer, { VideoPlayerRef } from '../components/player/VideoPlayer';
import TranscriptView from '../components/player/TranscriptView';
import PlaybackControls from '../components/player/PlaybackControls';
import { Loading } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import SettingsMenu from '../components/lesson/SettingsMenu';
import SpeedSelector from '../components/lesson/SpeedSelector';
import { progressService } from '../services/progress.service';
import { extractVideoId } from '../utils/youtube';
import { colors, spacing, borderRadius } from '../styles/theme';
import type { HomeStackScreenProps } from '../navigation/types';

type LessonScreenProps = HomeStackScreenProps<'Lesson'>;

export const LessonScreen: React.FC<LessonScreenProps> = ({ route, navigation }) => {
  const { lessonId } = route.params;

  // Hide navigation header and bottom tabs for full-screen experience
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });

    // Hide bottom tab bar
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }

    // Restore bottom tab bar when leaving screen
    return () => {
      if (parent) {
        parent.setOptions({
          tabBarStyle: undefined,
        });
      }
    };
  }, [navigation]);

  const { lesson, loading, error } = useLessonData(lessonId);

  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const [studyStartTime] = useState(Date.now());
  const [completedReported, setCompletedReported] = useState(false);

  // Settings menu state
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);
  const [autoStop, setAutoStop] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);

  const {
    isPlaying,
    playbackSpeed,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setPlaybackSpeed,
    togglePlayPause,
    setIsPlayingFromYouTube,
  } = useVideoPlayer();

  // Voice recording
  const { recordingState, startRecording, stopRecording, playRecording, clearRecording } = useVoiceRecording({
    onRecordingComplete: () => {
      // Recording complete
    },
    onError: (err) => {
      Alert.alert('Recording Error', err);
    },
  });

  // Transcript sync with 200ms polling
  const { activeSentenceIndex } = useTranscriptSync({
    transcript: lesson?.transcript || [],
    isPlaying,
    getCurrentTime: async () => {
      if (videoPlayerRef.current) {
        const time = await videoPlayerRef.current.getCurrentTime();
        setCurrentTime(time);
        return time;
      }
      return 0;
    },
  });

  // Clear recording when sentence changes
  React.useEffect(() => {
    if (recordingState.recordedUri) {
      clearRecording();
    }
  }, [activeSentenceIndex]);

  const handleReady = useCallback(async () => {
    // Get duration
    if (videoPlayerRef.current) {
      const dur = await videoPlayerRef.current.getDuration();
      setDuration(dur);
    }
  }, [setDuration]);

  const handleLessonComplete = useCallback(async () => {
    if (completedReported) {
      return; // Already reported
    }

    const studyTime = Math.floor((Date.now() - studyStartTime) / 1000); // seconds
    const pointsEarned = 10; // Base points for completing lesson

    try {
      const response = await progressService.saveProgress({
        lessonId,
        mode: 'shadowing',
        completed: true,
        pointsEarned,
        studyTime,
      });

      setCompletedReported(true);

      Alert.alert(
        'Lesson Complete! 🎉',
        `You earned ${pointsEarned} points!\nTotal points: ${response.user.points}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch {
      // Progress is queued for offline sync, show success anyway
      Alert.alert(
        'Lesson Complete! 🎉',
        `You earned ${pointsEarned} points! (Progress saved offline)`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [lessonId, studyStartTime, completedReported, navigation]);

  const handleStateChange = useCallback((state: string) => {
    // react-native-youtube-bridge returns PlayerState enum as string
    // PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
    const stateNum = parseInt(state, 10);

    if (stateNum === 1) { // PLAYING
      setIsPlayingFromYouTube(true);
    } else if (stateNum === 2) { // PAUSED
      setIsPlayingFromYouTube(false);
    } else if (stateNum === 0) { // ENDED
      setIsPlayingFromYouTube(false);
      handleLessonComplete();
    }
  }, [setIsPlayingFromYouTube, handleLessonComplete]);

  const handleError = useCallback(() => {
    Alert.alert('Video Error', 'Failed to load video. Please try again.');
  }, []);

  const handleSentencePress = useCallback((index: number) => {
    const sentence = lesson?.transcript[index];
    if (sentence && videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(sentence.startTime);
      setIsPlaying(true);
    }
  }, [lesson, setIsPlaying]);

  const handlePrevious = useCallback(() => {
    const transcript = lesson?.transcript || [];
    if (activeSentenceIndex > 0 && transcript.length > 0) {
      const prevSentence = transcript[activeSentenceIndex - 1];
      if (prevSentence && videoPlayerRef.current) {
        videoPlayerRef.current.seekTo(prevSentence.startTime);
        setIsPlaying(true);
      }
    }
  }, [activeSentenceIndex, lesson, setIsPlaying]);

  const handleNext = useCallback(() => {
    const transcript = lesson?.transcript || [];
    if (activeSentenceIndex < transcript.length - 1) {
      const nextSentence = transcript[activeSentenceIndex + 1];
      if (nextSentence && videoPlayerRef.current) {
        videoPlayerRef.current.seekTo(nextSentence.startTime);
        setIsPlaying(true);
      }
    }
  }, [activeSentenceIndex, lesson, setIsPlaying]);

  const handleMicrophone = useCallback(() => {
    const transcript = lesson?.transcript || [];
    const currentSentence = transcript[activeSentenceIndex];

    if (!currentSentence) {
      Alert.alert('Error', 'No sentence selected');
      return;
    }

    if (recordingState.isRecording) {
      // Stop recording and process
      stopRecording(currentSentence.text);
    } else {
      // Start recording
      // ALWAYS pause video when starting recording, regardless of isPlaying state

      // Force pause video directly via player ref
      if (videoPlayerRef.current) {
        videoPlayerRef.current.pause();
      }

      // Update state to ensure UI reflects paused state
      setIsPlaying(false);

      // Start recording after ensuring video is paused
      startRecording();
    }
  }, [lesson, activeSentenceIndex, recordingState.isRecording, stopRecording, startRecording, setIsPlaying]);

  const handleSpeedSelect = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, [setPlaybackSpeed]);

  if (loading) {
    return <Loading />;
  }

  if (error || !lesson) {
    return (
      <EmptyState
        icon="❌"
        title="Lesson Not Found"
        message="This lesson could not be loaded. It may have been removed or is temporarily unavailable."
        actionLabel="Go Back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  const videoId = extractVideoId(lesson.youtubeUrl);

  if (!videoId) {
    return (
      <EmptyState
        icon="⚠️"
        title="Invalid Video"
        message="This lesson's video URL is invalid."
        actionLabel="Go Back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  const transcript = lesson.transcript || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar with Back Button */}
      <View style={styles.headerBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.lessonTitle} numberOfLines={1}>
          {lesson?.title || 'Loading...'}
        </Text>
        
        <View style={styles.headerRight} />
      </View>

      {/* Video Player - Larger size */}
      <View style={styles.videoContainer}>
        <VideoPlayer
          ref={videoPlayerRef}
          videoId={videoId}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          onReady={handleReady}
          onStateChange={handleStateChange}
          onError={handleError}
        />
      </View>

      {/* Sentence Counter */}
      <View style={styles.sentenceCounter}>
        <Text style={styles.counterText}>
          <Text style={styles.counterCurrent}>#{activeSentenceIndex + 1}</Text>
          <Text style={styles.counterSeparator}> / </Text>
          <Text style={styles.counterTotal}>{transcript.length}</Text>
        </Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setShowSettingsMenu(true)}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Menu */}
      <SettingsMenu
        visible={showSettingsMenu}
        onClose={() => setShowSettingsMenu(false)}
        playbackSpeed={playbackSpeed}
        onSpeedPress={() => {
          setShowSettingsMenu(false);
          setShowSpeedSelector(true);
        }}
        autoStop={autoStop}
        onAutoStopToggle={() => setAutoStop(!autoStop)}
        showTranslation={showTranslation}
        onTranslationToggle={() => setShowTranslation(!showTranslation)}
      />

      {/* Speed Selector */}
      <SpeedSelector
        visible={showSpeedSelector}
        onClose={() => setShowSpeedSelector(false)}
        currentSpeed={playbackSpeed}
        onSelectSpeed={handleSpeedSelect}
      />

      {/* Transcript List */}
      <View style={styles.transcriptContainer}>
        <TranscriptView
          transcript={transcript}
          activeSentenceIndex={activeSentenceIndex}
          onSentencePress={handleSentencePress}
          showTranslation={showTranslation}
          voiceRecordingResult={recordingState.comparisonResult}
        />
      </View>

      {/* Bottom Controls */}
      <PlaybackControls
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onMicrophone={handleMicrophone}
        isRecording={recordingState.isRecording}
        isProcessing={recordingState.isProcessing}
        hasRecording={!!recordingState.recordedUri}
        isPlayingRecording={recordingState.isPlaying}
        onPlayRecording={playRecording}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e', // Darker background
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
    height: 56,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  backIcon: {
    fontSize: 20,
    color: colors.accentBlue,
    fontWeight: '600',
    marginRight: 4,
  },
  backText: {
    fontSize: 16,
    color: colors.accentBlue,
    fontWeight: '600',
  },
  lessonTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  headerRight: {
    width: 60, // Balance the back button width
  },
  videoContainer: {
    height: 240, // Slightly reduced to fit header
    backgroundColor: '#000',
  },
  sentenceCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#0a0f1e',
  },
  counterText: {
    fontSize: 20,
    fontWeight: '600',
  },
  counterCurrent: {
    color: colors.accentBlue,
    fontSize: 24,
    fontWeight: '700',
  },
  counterSeparator: {
    color: colors.textMuted,
    fontSize: 20,
  },
  counterTotal: {
    color: colors.textMuted,
    fontSize: 20,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 22,
  },
  transcriptContainer: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
});

export default LessonScreen;
