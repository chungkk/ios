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
import LockedLessonOverlay from '../components/lesson/LockedLessonOverlay';
import { progressService } from '../services/progress.service';
import { unlockService } from '../services/unlock.service';
import { homepageService } from '../services/homepage.service';
import { recordShadowingAttempt, recordShadowingStudyTime } from '../services/statistics.service';
import { extractVideoId } from '../utils/youtube';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../hooks/useAuth';
import { colors, spacing } from '../styles/theme';
import WordTranslatePopup from '../components/common/WordTranslatePopup';
import type { HomeStackScreenProps } from '../navigation/types';
import type { UserUnlockInfo } from '../types/unlock.types';

type LessonScreenProps = HomeStackScreenProps<'Lesson'>;

export const LessonScreen: React.FC<LessonScreenProps> = ({ route, navigation }) => {
  const { lessonId } = route.params;
  const { settings } = useSettings();
  const { updateUserPoints } = useAuth();
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
  const [recordedSentences, setRecordedSentences] = useState<Set<number>>(new Set()); // Track sentences user has recorded
  const [rewardedSentences, setRewardedSentences] = useState<Set<number>>(new Set()); // Track sentences that got 80%+ reward
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [bonusAwarded, setBonusAwarded] = useState(false); // Track if lesson completion bonus was awarded
  // Store recording results for each sentence
  const [recordingResults, setRecordingResults] = useState<Record<number, {
    transcribed: string;
    original: string;
    similarity: number;
    isCorrect: boolean;
    wordComparison: Record<number, 'correct' | 'incorrect' | 'missing'>;
  }>>({});
  // Track which sentence is currently being recorded (to save result to correct index)
  const [recordingSentenceIndex, setRecordingSentenceIndex] = useState<number | null>(null);
  // Ref to track if recording is in progress (prevent race condition)
  const isRecordingInProgressRef = useRef(false);

  // Settings state
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Get autoStop and showTranslation from global settings
  const { toggleAutoStop, toggleShowTranslation } = useSettings();

  // Speed options for playback
  // Moved inside useCallback to prevent re-creation on every render

  // Word translation popup state
  const [selectedWord, setSelectedWord] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const [showTranslatePopup, setShowTranslatePopup] = useState(false);

  // Unlock state for locked lessons
  const [userUnlockInfo, setUserUnlockInfo] = useState<UserUnlockInfo | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Fetch user unlock info on mount
  useEffect(() => {
    const fetchUnlockInfo = async () => {
      try {
        const data = await homepageService.fetchHomepageData('all', 1);
        setUserUnlockInfo(data.userUnlockInfo || null);
      } catch (error) {
        console.log('[LessonScreen] Could not fetch unlock info:', error);
      }
    };
    fetchUnlockInfo();
  }, []);

  const {
    isPlaying,
    playbackSpeed,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setPlaybackSpeed,
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
    onRecordingComplete: () => { },
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
    // Disabled - no vibration on record button press
  }, []);

  const vibrateComplete = useCallback(() => {
    if (!settings.hapticEnabled) return;
    Vibration.vibrate([0, 100, 50, 100, 50, 100]);
  }, [settings.hapticEnabled]);

  // TODO: Uncomment when sentence change vibration is added to UI
  // const vibrateSentenceChange = useCallback(() => {
  //   if (!settings.hapticEnabled) return;
  //   Vibration.vibrate(20);
  // }, [settings.hapticEnabled]);

  // Handle sentence end for auto-stop
  const handleSentenceEnd = useCallback((sentenceIndex: number) => {
    if (!settings.autoStop) return;

    if (__DEV__) console.log('[LessonScreen] Auto-stop at sentence', sentenceIndex);
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
  const { activeSentenceIndex, activeWordIndex } = useTranscriptSync({
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

  // Clear recording when sentence changes (only if not actively recording/processing)
  React.useEffect(() => {
    if (recordingState.recordedUri && !isRecordingInProgressRef.current && !recordingState.isProcessing) {
      if (__DEV__) console.log('[LessonScreen] 🧹 Clearing recording due to sentence change');
      clearRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSentenceIndex]);

  // Handle processing completion (including failures)
  React.useEffect(() => {
    // When processing completes (successfully or with error), mark as done
    if (isRecordingInProgressRef.current && !recordingState.isRecording && !recordingState.isProcessing) {
      if (__DEV__) console.log('[LessonScreen] Processing complete, marking recording as done');
      isRecordingInProgressRef.current = false;
    }
  }, [recordingState.isRecording, recordingState.isProcessing]);

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const { progress: savedProgress } = await progressService.getProgress(lessonId, 'shadowing');
        if (savedProgress) {
          if (savedProgress.recordedSentences) {
            setRecordedSentences(new Set(savedProgress.recordedSentences));
          }
          if (savedProgress.rewardedSentences) {
            setRewardedSentences(new Set(savedProgress.rewardedSentences));
          }
          // Load saved recording results
          if (savedProgress.recordingResults) {
            setRecordingResults(savedProgress.recordingResults);
          }
          if (savedProgress.bonusAwarded) {
            setBonusAwarded(savedProgress.bonusAwarded);
          }
          if (__DEV__) console.log('[LessonScreen] Loaded saved progress:', savedProgress);
        }
      } catch (err) {
        console.error('[LessonScreen] Error loading progress:', err);
      } finally {
        setProgressLoaded(true);
      }
    };
    loadProgress();
  }, [lessonId]);

  // Save progress when recordedSentences, rewardedSentences, or recordingResults changes
  const saveProgressRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!progressLoaded || (recordedSentences.size === 0 && rewardedSentences.size === 0 && Object.keys(recordingResults).length === 0)) return;

    if (saveProgressRef.current) {
      clearTimeout(saveProgressRef.current);
    }

    saveProgressRef.current = setTimeout(async () => {
      try {
        await progressService.saveDictationProgress(
          lessonId,
          {
            recordedSentences: Array.from(recordedSentences),
            rewardedSentences: Array.from(rewardedSentences),
            recordingResults: recordingResults,
            bonusAwarded,
          },
          studyTime,
          'shadowing' // Use correct mode so it can be retrieved later
        );
        if (__DEV__) console.log('[LessonScreen] Progress saved with recordingResults');
      } catch (err) {
        console.error('[LessonScreen] Error saving progress:', err);
      }
    }, 1000);
  }, [recordedSentences, rewardedSentences, recordingResults, lessonId, studyTime, progressLoaded, bonusAwarded]);

  const handleReady = useCallback(async () => {
    if (videoPlayerRef.current) {
      const dur = await videoPlayerRef.current.getDuration();
      setDuration(dur);
    }
  }, [setDuration]);

  const handleLessonComplete = useCallback(async () => {
    if (completedReported) return;

    const pointsEarned = 10;
    // const _totalSentences = lesson?.transcript?.length || 0; // TODO: Use for completion stats

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

      // Record study time (sentences already tracked real-time)
      await recordShadowingStudyTime(studyTime);

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
      // Don't set isRecordingInProgressRef to false here - wait until processing completes
      stopRecording(currentSentence.text);
    } else {
      if (videoPlayerRef.current) {
        videoPlayerRef.current.pause();
      }
      setIsPlaying(false);
      // Save which sentence we're recording for (so result goes to correct index)
      setRecordingSentenceIndex(activeSentenceIndex);
      isRecordingInProgressRef.current = true; // Recording started
      // Mark this sentence as recorded for progress tracking
      if (!recordedSentences.has(activeSentenceIndex)) {
        setRecordedSentences(prev => new Set([...prev, activeSentenceIndex]));
      }
      startRecording();
    }
  }, [lesson, activeSentenceIndex, recordingState.isRecording, stopRecording, startRecording, setIsPlaying, vibrateRecord, vibrateError, recordedSentences]);

  // Haptic feedback and reward when voice comparison result changes
  useEffect(() => {
    if (recordingState.comparisonResult && recordingSentenceIndex !== null) {
      // FIX: Use 'similarity' instead of 'overallSimilarity' to match ComparisonResult type
      const similarity = recordingState.comparisonResult.similarity || 0;
      // Use the saved recordingSentenceIndex (not activeSentenceIndex which may have changed)
      const targetIndex = recordingSentenceIndex;
      if (__DEV__) console.log('[LessonScreen] Voice comparison result:', { similarity, targetIndex, activeSentenceIndex, comparisonResult: recordingState.comparisonResult });

      // Save recording result to the CORRECT sentence index
      setRecordingResults(prev => ({
        ...prev,
        [targetIndex]: recordingState.comparisonResult!
      }));

      // Record statistics based on actual result (correct = similarity >= 80%)
      const isCorrect = similarity >= 80;
      const pointsForStats = isCorrect ? 1 : 0;
      recordShadowingAttempt({ similarity, isCorrect, pointsEarned: pointsForStats });
      if (__DEV__) console.log('[LessonScreen] 📊 Statistics recorded:', { isCorrect, similarity, targetIndex });

      if (similarity >= 80) {
        vibrateSuccess();
        if (__DEV__) console.log('[LessonScreen] ✅ Similarity >= 80%!', { similarity, alreadyRewarded: rewardedSentences.has(targetIndex) });

        // Award +1 point if this sentence hasn't been rewarded yet
        if (!rewardedSentences.has(targetIndex)) {
          if (__DEV__) console.log('[LessonScreen] 💎 Awarding +1 point for sentence', targetIndex);
          setRewardedSentences(prev => new Set([...prev, targetIndex]));
          progressService.addUserPoints(1, 'shadowing_80_percent').then(result => {
            if (__DEV__) console.log('[LessonScreen] 💎 addUserPoints result:', result);
            if (result.success && result.points !== undefined) {
              if (__DEV__) console.log('[LessonScreen] 💎 Updating user points to:', result.points);
              updateUserPoints(result.points);
            } else {
              if (__DEV__) console.log('[LessonScreen] ❌ addUserPoints failed or no points returned');
            }
          }).catch(err => {
            if (__DEV__) console.error('[LessonScreen] ❌ addUserPoints error:', err);
          });
        } else {
          if (__DEV__) console.log('[LessonScreen] ⏭️ Sentence already rewarded, skipping');
        }

        // Check if ALL sentences are now completed (80%+) - award lesson completion bonus
        const transcript = lesson?.transcript || [];
        const totalSentences = transcript.length;
        const newRewardedSize = rewardedSentences.size + 1; // +1 because we just added current
        if (newRewardedSize === totalSentences && totalSentences > 0 && !bonusAwarded) {
          let bonusPoints = 0;
          if (totalSentences >= 100) {
            bonusPoints = 50;
          } else if (totalSentences >= 50) {
            bonusPoints = 20;
          }

          if (bonusPoints > 0) {
            setBonusAwarded(true);
            vibrateComplete();
            progressService.addUserPoints(bonusPoints, `shadowing_lesson_complete_${totalSentences}_sentences`).then(result => {
              if (result.success && result.points !== undefined) {
                updateUserPoints(result.points);
                Alert.alert('🎉 Hoàn thành!', `Bạn đã hoàn thành bài Shadowing!\n+${bonusPoints} điểm thưởng!`);
              }
            });
          }
        }
      } else if (similarity >= 50) {
        // Medium vibration for partial match
        if (settings.hapticEnabled) {
          Vibration.vibrate(40);
        }
      } else {
        vibrateError();
      }

      // Clear the recording sentence index after processing
      setRecordingSentenceIndex(null);
    }
  }, [recordingState.comparisonResult, vibrateSuccess, vibrateError, settings.hapticEnabled, recordingSentenceIndex, activeSentenceIndex, rewardedSentences, updateUserPoints, bonusAwarded, lesson, vibrateComplete]);

  // Cycle to next speed
  const cycleSpeed = useCallback(() => {
    const SPEED_OPTIONS: (0.5 | 0.75 | 1 | 1.25 | 1.5 | 2)[] = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndexSpeed = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextIndex = (currentIndexSpeed + 1) % SPEED_OPTIONS.length;
    setPlaybackSpeed(SPEED_OPTIONS[nextIndex]);
  }, [playbackSpeed, setPlaybackSpeed]);

  // Handle word press for translation
  const handleWordPress = useCallback((word: string, context: string) => {
    // Pause video before showing popup so user can read translation quietly
    if (videoPlayerRef.current) {
      videoPlayerRef.current.pause();
    }
    setIsPlaying(false);

    setSelectedWord(word);
    setSelectedContext(context);
    setShowTranslatePopup(true);
  }, [setIsPlaying]);

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

  // Handle unlock for locked lessons
  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      const result = await unlockService.unlockLesson(lessonId);
      if (result.success) {
        // Refresh lesson data to get unlocked content
        // The lesson will be refetched and isLocked should be false now
        // For now, just navigate back and let user click again
        navigation.goBack();
      } else {
        Alert.alert('Unlock Failed', result.error || 'Could not unlock lesson');
      }
    } catch (error: any) {
      console.error('[LessonScreen] Unlock error:', error);
      Alert.alert('Error', 'Failed to unlock lesson');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Show locked overlay if lesson is locked
  if (lesson.isLocked) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={18} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>
        <LockedLessonOverlay
          lesson={lesson}
          userUnlockInfo={userUnlockInfo}
          onUnlock={handleUnlock}
          onGoBack={() => navigation.goBack()}
          isLoading={isUnlocking}
        />
      </View>
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
  const shadowingProgress = transcript.length > 0 ? (recordedSentences.size / transcript.length) * 100 : 0;

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
          <View style={styles.progressWrapper}>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${shadowingProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(shadowingProgress)}%</Text>
          </View>
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
            activeWordIndex={activeWordIndex}
            onSentencePress={handleSentencePress}
            onWordPress={handleWordPress}
            showTranslation={settings.showTranslation}
            recordingResults={recordingResults}
          />
        </View>
      </View>

      {/* Bottom Controls - Neo-Retro Style */}
      <View style={[styles.controlsWrapper, { paddingBottom: insets.bottom || 14 }]}>
        <PlaybackControls
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
  // Progress bar
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 12,
    gap: 8,
  },
  progressBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.retroCoral,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
    minWidth: 40,
    textAlign: 'center',
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
