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
  
  console.log('[LessonScreen] Loading lesson with ID:', lessonId);
  
  const { lesson, loading, error } = useLessonData(lessonId);
  
  console.log('[LessonScreen] State:', { 
    hasLesson: !!lesson, 
    loading, 
    hasError: !!error,
    transcriptLength: lesson?.transcript?.length || 0 
  });
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
    onRecordingComplete: (result) => {
      console.log('[LessonScreen] Recording complete:', result);
    },
    onError: (error) => {
      console.error('[LessonScreen] Recording error:', error);
      Alert.alert('Recording Error', error);
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
    console.log('[LessonScreen] Video player ready');
    
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
      console.log('[LessonScreen] Lesson completed, saving progress');
      
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
    } catch (err) {
      console.error('[LessonScreen] Error saving progress:', err);
      // Progress is queued for offline sync, show success anyway
      Alert.alert(
        'Lesson Complete! 🎉',
        `You earned ${pointsEarned} points! (Progress saved offline)`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [lessonId, studyStartTime, completedReported, navigation]);

  const handleStateChange = useCallback((state: string) => {
    console.log('[LessonScreen] Player state changed:', state);
    
    if (state === 'playing') {
      setIsPlayingFromYouTube(true);
    } else if (state === 'paused') {
      setIsPlayingFromYouTube(false);
    } else if (state === 'ended') {
      setIsPlayingFromYouTube(false);
      handleLessonComplete();
    }
  }, [setIsPlayingFromYouTube, handleLessonComplete]);

  const handleError = useCallback((errorMsg: string) => {
    console.error('[LessonScreen] Video player error:', errorMsg);
    Alert.alert('Video Error', 'Failed to load video. Please try again.');
  }, []);

  const handleSentencePress = useCallback((index: number) => {
    const sentence = lesson?.transcript[index];
    if (sentence && videoPlayerRef.current) {
      console.log('[LessonScreen] Seeking to sentence:', index, sentence.startTime);
      videoPlayerRef.current.seekTo(sentence.startTime);
      setIsPlaying(true);
    }
  }, [lesson, setIsPlaying]);

  const handlePrevious = useCallback(() => {
    const transcript = lesson?.transcript || [];
    if (activeSentenceIndex > 0 && transcript.length > 0) {
      const prevSentence = transcript[activeSentenceIndex - 1];
      if (prevSentence && videoPlayerRef.current) {
        console.log('[LessonScreen] Previous - seeking to:', prevSentence.startTime);
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
        console.log('[LessonScreen] Next - seeking to:', nextSentence.startTime);
        videoPlayerRef.current.seekTo(nextSentence.startTime);
        setIsPlaying(true);
      }
    }
  }, [activeSentenceIndex, lesson, setIsPlaying]);

  const handleMicrophone = useCallback(() => {
    console.log('[LessonScreen] Microphone pressed');
    
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
      // Pause video first
      if (isPlaying && videoPlayerRef.current) {
        setIsPlaying(false);
      }
      startRecording();
    }
  }, [lesson, activeSentenceIndex, recordingState.isRecording, isPlaying, stopRecording, startRecording, setIsPlaying]);

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
  console.log('[LessonScreen] Rendering with transcript length:', transcript.length);

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button - Floating */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

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
  backButton: {
    position: 'absolute',
    top: 50, // Below status bar
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  backIcon: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '300',
  },
  videoContainer: {
    height: 280, // Larger video
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
