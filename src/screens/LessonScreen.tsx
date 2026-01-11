// LessonScreen - Shadowing Mode with Neo-Retro Design
// Video player with synchronized transcript for shadowing practice

import React, { useRef, useState, useCallback, useLayoutEffect } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useLessonData } from '../hooks/useLessonData';
import { useStudyTimer } from '../hooks/useStudyTimer';
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
import { colors, spacing } from '../styles/theme';
import type { HomeStackScreenProps } from '../navigation/types';

type LessonScreenProps = HomeStackScreenProps<'Lesson'>;

export const LessonScreen: React.FC<LessonScreenProps> = ({ route, navigation }) => {
  const { lessonId } = route.params;
  const parentNavigation = useNavigation().getParent();
  const insets = useSafeAreaInsets();

  // Hide navigation header and tab bar
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
    parentNavigation?.setOptions({ tabBarStyle: { display: 'none' } });
    
    return () => {
      parentNavigation?.setOptions({ 
        tabBarStyle: {
          backgroundColor: '#FFF8E7',
          borderTopColor: '#1a1a2e',
          borderTopWidth: 3,
          height: 75,
          paddingBottom: 14,
          paddingTop: 10,
          display: 'flex',
        } 
      });
    };
  }, [navigation, parentNavigation]);

  const { lesson, loading, error } = useLessonData(lessonId);

  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const [completedReported, setCompletedReported] = useState(false);

  // Settings state
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

  // Study timer
  const { studyTime, formattedTime } = useStudyTimer({
    isPlaying,
    lessonId,
    mode: 'shadowing',
  });

  // Voice recording
  const { recordingState, startRecording, stopRecording, playRecording, clearRecording } = useVoiceRecording({
    onRecordingComplete: () => {},
    onError: (err) => Alert.alert('Recording Error', err),
  });

  // Transcript sync
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSentenceIndex]);

  const handleReady = useCallback(async () => {
    if (videoPlayerRef.current) {
      const dur = await videoPlayerRef.current.getDuration();
      setDuration(dur);
    }
  }, [setDuration]);

  const handleLessonComplete = useCallback(async () => {
    if (completedReported) return;

    const pointsEarned = 10;

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
        'Lesson Complete!',
        `You earned ${pointsEarned} points!\nStudy Time: ${formattedTime}\nTotal points: ${response.user.points}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert(
        'Lesson Complete!',
        `You earned ${pointsEarned} points! (Saved offline)\nStudy Time: ${formattedTime}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [lessonId, studyTime, formattedTime, completedReported, navigation]);

  const handleStateChange = useCallback((state: string) => {
    const stateNum = parseInt(state, 10);
    if (stateNum === 1) {
      setIsPlayingFromYouTube(true);
    } else if (stateNum === 2) {
      setIsPlayingFromYouTube(false);
    } else if (stateNum === 0) {
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
      stopRecording(currentSentence.text);
    } else {
      if (videoPlayerRef.current) {
        videoPlayerRef.current.pause();
      }
      setIsPlaying(false);
      startRecording();
    }
  }, [lesson, activeSentenceIndex, recordingState.isRecording, stopRecording, startRecording, setIsPlaying]);

  const handleSpeedSelect = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, [setPlaybackSpeed]);

  if (loading) return <Loading />;

  if (error || !lesson) {
    return (
      <EmptyState
        icon="close-circle"
        title="Lesson Not Found"
        message="This lesson could not be loaded."
        actionLabel="Go Back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  const videoId = extractVideoId(lesson.youtubeUrl);

  if (!videoId) {
    return (
      <EmptyState
        icon="alert-circle"
        title="Invalid Video"
        message="This lesson's video URL is invalid."
        actionLabel="Go Back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  const transcript = lesson.transcript || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Neo-Retro Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={18} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        {/* Study Timer */}
        <View style={styles.timerContainer}>
          <Icon name="time-outline" size={14} color={colors.retroDark} />
          <Text style={styles.timerText}>{formattedTime}</Text>
        </View>
        
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettingsMenu(true)}>
          <Icon name="settings-outline" size={22} color={colors.retroDark} />
        </TouchableOpacity>
      </View>

      {/* Video Player - Full Width */}
      {videoId && (
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
      )}

      {/* Sentence Counter */}
      <View style={styles.sentenceCounter}>
        <View style={styles.counterBox}>
          <Text style={styles.counterCurrent}>#{activeSentenceIndex + 1}</Text>
          <Text style={styles.counterSeparator}>/</Text>
          <Text style={styles.counterTotal}>{transcript.length}</Text>
        </View>
        <View style={styles.speedBadge}>
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </View>
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

      {/* Transcript Section - Full Width */}
      <View style={styles.transcriptSection}>
        <View style={styles.transcriptTopBar} />
        <View style={styles.transcriptHeader}>
          <Text style={styles.transcriptTitle}>📝 Transcript</Text>
          <TouchableOpacity 
            style={styles.translationToggle}
            onPress={() => setShowTranslation(!showTranslation)}
          >
            <Icon 
              name={showTranslation ? 'eye' : 'eye-off'} 
              size={16} 
              color={colors.retroDark} 
            />
          </TouchableOpacity>
        </View>
        <View style={styles.transcriptContent}>
          <TranscriptView
            transcript={transcript}
            activeSentenceIndex={activeSentenceIndex}
            onSentencePress={handleSentencePress}
            showTranslation={showTranslation}
            voiceRecordingResult={recordingState.comparisonResult}
          />
        </View>
      </View>

      {/* Bottom Controls - Neo-Retro Style */}
      <View style={[styles.controlsWrapper, { paddingBottom: insets.bottom || 14 }]}>
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  // Neo-Retro Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.retroCream,
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.retroCyan,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    gap: 4,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 2,
  },
  backText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.retroYellow,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    gap: 6,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 2,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.retroDark,
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
    letterSpacing: 1,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.retroCream,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Video Container - Full Width like Dictation
  videoContainer: {
    height: 200,
    backgroundColor: '#000',
  },
  // Sentence Counter
  sentenceCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.retroCream,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  counterCurrent: {
    color: colors.retroPurple,
    fontSize: 22,
    fontWeight: '800',
  },
  counterSeparator: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  counterTotal: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '600',
  },
  speedBadge: {
    backgroundColor: colors.retroYellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  speedText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.retroDark,
  },
  // Transcript Section - Full Width
  transcriptSection: {
    flex: 1,
    backgroundColor: '#fff',
  },
  transcriptTopBar: {
    height: 4,
    backgroundColor: colors.retroCoral,
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 107, 129, 0.08)',
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
  },
  transcriptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.retroDark,
  },
  translationToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.retroCream,
    borderWidth: 1,
    borderColor: colors.retroBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcriptContent: {
    flex: 1,
  },
  // Controls Wrapper
  controlsWrapper: {
    backgroundColor: colors.retroCream,
    borderTopWidth: 2,
    borderTopColor: colors.retroBorder,
  },
});

export default LessonScreen;
