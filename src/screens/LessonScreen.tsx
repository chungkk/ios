// LessonScreen - Shadowing Mode with Neo-Retro Design
// Video player with synchronized transcript for shadowing practice

import React, { useRef, useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, Platform, Vibration } from 'react-native';
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
import { progressService } from '../services/progress.service';
import { extractVideoId } from '../utils/youtube';
import { useSettings } from '../contexts/SettingsContext';
import { colors, spacing } from '../styles/theme';
import WordTranslatePopup from '../components/common/WordTranslatePopup';
import type { HomeStackScreenProps } from '../navigation/types';

type LessonScreenProps = HomeStackScreenProps<'Lesson'>;

export const LessonScreen: React.FC<LessonScreenProps> = ({ route, navigation }) => {
  const { lessonId } = route.params;
  const { settings } = useSettings();
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
  
  // Get autoStop and showTranslation from global settings
  const { toggleAutoStop, toggleShowTranslation } = useSettings();
  
  // Cycle through speed options
  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
  
  // Word translation popup state
  const [selectedWord, setSelectedWord] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const [showTranslatePopup, setShowTranslatePopup] = useState(false);

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

  // Haptic feedback functions (only vibrate if enabled in settings)
  const vibrateSuccess = useCallback(() => {
    if (!settings.hapticEnabled) return;
    Vibration.vibrate(50);
  }, [settings.hapticEnabled]);

  const vibrateError = useCallback(() => {
    if (!settings.hapticEnabled) return;
    Vibration.vibrate([0, 50, 50, 50]);
  }, [settings.hapticEnabled]);

  const vibrateRecord = useCallback(() => {
    if (!settings.hapticEnabled) return;
    Vibration.vibrate(30);
  }, [settings.hapticEnabled]);

  const vibrateComplete = useCallback(() => {
    if (!settings.hapticEnabled) return;
    Vibration.vibrate([0, 100, 50, 100, 50, 100]);
  }, [settings.hapticEnabled]);

  const vibrateSentenceChange = useCallback(() => {
    if (!settings.hapticEnabled) return;
    Vibration.vibrate(20);
  }, [settings.hapticEnabled]);

  // Handle sentence end for auto-stop
  const handleSentenceEnd = useCallback((sentenceIndex: number) => {
    if (!settings.autoStop) return;
    
    console.log('[LessonScreen] Auto-stop at sentence', sentenceIndex);
    const transcript = lesson?.transcript || [];
    const currentSentence = transcript[sentenceIndex];
    
    if (videoPlayerRef.current) {
      videoPlayerRef.current.pause();
      // Seek back to start of sentence so it stays on current sentence
      if (currentSentence) {
        setTimeout(() => {
          videoPlayerRef.current?.seekTo(currentSentence.startTime);
        }, 100);
      }
    }
    setIsPlaying(false);
  }, [settings.autoStop, setIsPlaying, lesson]);

  // Transcript sync
  const { activeSentenceIndex, resetSentenceEndFlag } = useTranscriptSync({
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
    onSentenceEnd: handleSentenceEnd,
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
    
    // Celebration vibration
    vibrateComplete();

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
  }, [lessonId, studyTime, formattedTime, completedReported, navigation, vibrateComplete]);

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
      vibrateError();
      Alert.alert('Error', 'No sentence selected');
      return;
    }

    // Haptic feedback for recording toggle
    vibrateRecord();

    if (recordingState.isRecording) {
      stopRecording(currentSentence.text);
    } else {
      if (videoPlayerRef.current) {
        videoPlayerRef.current.pause();
      }
      setIsPlaying(false);
      startRecording();
    }
  }, [lesson, activeSentenceIndex, recordingState.isRecording, stopRecording, startRecording, setIsPlaying, vibrateRecord, vibrateError]);

  // Haptic feedback when voice comparison result changes
  useEffect(() => {
    if (recordingState.comparisonResult) {
      const similarity = recordingState.comparisonResult.overallSimilarity || 0;
      if (similarity >= 80) {
        vibrateSuccess();
      } else if (similarity >= 50) {
        // Medium vibration for partial match
        if (settings.hapticEnabled) {
          Vibration.vibrate(40);
        }
      } else {
        vibrateError();
      }
    }
  }, [recordingState.comparisonResult, vibrateSuccess, vibrateError, settings.hapticEnabled]);

  // Cycle to next speed
  const cycleSpeed = useCallback(() => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    setPlaybackSpeed(SPEED_OPTIONS[nextIndex]);
  }, [playbackSpeed, setPlaybackSpeed]);

  // Custom play/pause handler for auto-stop mode
  const handlePlayPause = useCallback(() => {
    if (!isPlaying && settings.autoStop) {
      // When auto-stop is ON and pressing play:
      const transcript = lesson?.transcript || [];
      const currentSentence = transcript[activeSentenceIndex];
      
      if (currentSentence && videoPlayerRef.current) {
        // 1. Reset the flag so onSentenceEnd can be called again
        resetSentenceEndFlag();
        // 2. Seek to start of current sentence
        videoPlayerRef.current.seekTo(currentSentence.startTime);
        // 3. Small delay to ensure seek completes before play
        setTimeout(() => {
          setIsPlaying(true);
        }, 100);
        return;
      }
    }
    
    togglePlayPause();
  }, [lesson, activeSentenceIndex, isPlaying, settings.autoStop, togglePlayPause, resetSentenceEndFlag, setIsPlaying]);

  // Handle word press for translation
  const handleWordPress = useCallback((word: string, context: string) => {
    setSelectedWord(word);
    setSelectedContext(context);
    setShowTranslatePopup(true);
  }, []);

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

      {/* Settings Menu */}
      <SettingsMenu
        visible={showSettingsMenu}
        onClose={() => setShowSettingsMenu(false)}
        playbackSpeed={playbackSpeed}
        onSpeedCycle={cycleSpeed}
        autoStop={settings.autoStop}
        onAutoStopToggle={toggleAutoStop}
        showTranslation={settings.showTranslation}
        onTranslationToggle={toggleShowTranslation}
      />

      {/* Transcript Section - Full Width */}
      <View style={styles.transcriptSection}>
        <View style={styles.transcriptTopBar} />
        <View style={styles.transcriptHeader}>
          <Text style={styles.transcriptTitle}>📝 Transcript</Text>
          <View style={styles.counterBox}>
            <Text style={styles.counterCurrent}>{activeSentenceIndex + 1}</Text>
            <Text style={styles.counterSeparator}>/</Text>
            <Text style={styles.counterTotal}>{transcript.length}</Text>
          </View>
        </View>
        <View style={styles.transcriptContent}>
          <TranscriptView
            transcript={transcript}
            activeSentenceIndex={activeSentenceIndex}
            onSentencePress={handleSentencePress}
            onWordPress={handleWordPress}
            showTranslation={settings.showTranslation}
            voiceRecordingResult={recordingState.comparisonResult}
          />
        </View>
      </View>

      {/* Bottom Controls - Neo-Retro Style */}
      <View style={[styles.controlsWrapper, { paddingBottom: insets.bottom || 14 }]}>
        <PlaybackControls
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
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

      {/* Word Translation Popup */}
      <WordTranslatePopup
        visible={showTranslatePopup}
        word={selectedWord}
        context={selectedContext}
        lessonId={lessonId}
        lessonTitle={lesson?.title}
        onClose={() => setShowTranslatePopup(false)}
      />
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
  // Sentence Counter (in transcript header)
  counterBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.retroCream,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.retroBorder,
  },
  counterCurrent: {
    color: colors.retroPurple,
    fontSize: 15,
    fontWeight: '800',
  },
  counterSeparator: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 2,
  },
  counterTotal: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
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
    backgroundColor: colors.retroCoral,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
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
