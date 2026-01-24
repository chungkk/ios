// DictationScreen - Neo-Retro Design
// Full dictation practice with video, transcript, and word-by-word input

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useLessonData } from '../hooks/useLessonData';
import { useStudyTimer } from '../hooks/useStudyTimer';
import VideoPlayer, { VideoPlayerRef } from '../components/player/VideoPlayer';
import { Loading } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { progressService } from '../services/progress.service';
import { recordDictationComplete, recordPointsDeducted } from '../services/statistics.service';
import { extractVideoId } from '../utils/youtube';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../hooks/useAuth';
import { colors, spacing } from '../styles/theme';
import WordTranslatePopup from '../components/common/WordTranslatePopup';
import Toast, { ToastType } from '../components/common/Toast';
import HintBox from '../components/dictation/HintBox';
import type { HomeStackScreenProps } from '../navigation/types';
import type { Sentence } from '../types/lesson.types';

type DictationScreenProps = HomeStackScreenProps<'Dictation'>;

const DictationScreen: React.FC<DictationScreenProps> = ({ route, navigation }) => {
  const { lessonId } = route.params;
  const { lesson, loading, error } = useLessonData(lessonId);
  const { settings } = useSettings();
  const { userPoints, updateUserPoints } = useAuth();
  const { t } = useTranslation();
  const parentNavigation = useNavigation().getParent();
  const insets = useSafeAreaInsets();

  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const inputRef = useRef<TextInput>(null);

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [userInputs, setUserInputs] = useState<{ [key: number]: string }>({}); // Store input per sentence
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSentences, setCompletedSentences] = useState<Set<number>>(new Set());
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 0.75 | 1 | 1.25 | 1.5 | 2>(1);
  const [revealedWords, setRevealedWords] = useState<{ [key: string]: boolean }>({});
  const [revealCount, setRevealCount] = useState<{ [key: number]: number }>({}); // Track reveals per sentence
  const [progressLoaded, setProgressLoaded] = useState(false); // Track if progress is loaded
  const [allowReEdit, setAllowReEdit] = useState<Set<number>>(new Set()); // Allow re-editing completed sentences on double tap
  const [bonusAwarded, setBonusAwarded] = useState(false); // Track if lesson completion bonus was awarded

  // Word translation popup state
  const [selectedWord, setSelectedWord] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const [showTranslatePopup, setShowTranslatePopup] = useState(false);

  // Toast notification state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<ToastType>('info');
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Keyboard state
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Study timer
  const { studyTime, formattedTime } = useStudyTimer({
    isPlaying,
    lessonId,
    mode: 'dictation',
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

  const vibrateHint = useCallback(() => {
    if (!settings.hapticEnabled) return;
    Vibration.vibrate(30);
  }, [settings.hapticEnabled]);

  // TODO: Uncomment when complete button is added
  // const vibrateComplete = useCallback(() => {
  //   if (!settings.hapticEnabled) return;
  //   Vibration.vibrate([0, 100, 50, 100, 50, 100]);
  // }, [settings.hapticEnabled]);

  const vibratePartial = useCallback(() => {
    if (!settings.hapticEnabled) return;
    Vibration.vibrate(40);
  }, [settings.hapticEnabled]);

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

  // Listen for keyboard show/hide
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const { progress: savedProgress } = await progressService.getProgress(lessonId, 'dictation');
        if (savedProgress && typeof savedProgress === 'object') {
          if (savedProgress.revealedWords) {
            setRevealedWords(savedProgress.revealedWords);
          }
          if (savedProgress.completedSentences) {
            setCompletedSentences(new Set(savedProgress.completedSentences));
          }
          if (savedProgress.revealCount) {
            setRevealCount(savedProgress.revealCount);
          }
          if (typeof savedProgress.currentIndex === 'number') {
            setCurrentIndex(savedProgress.currentIndex);
          }
          if (savedProgress.userInputs) {
            setUserInputs(savedProgress.userInputs);
            // Set current input for the loaded index
            if (savedProgress.userInputs[savedProgress.currentIndex || 0]) {
              setUserInput(savedProgress.userInputs[savedProgress.currentIndex || 0]);
            }
          }
          if (savedProgress.bonusAwarded) {
            setBonusAwarded(savedProgress.bonusAwarded);
          }
          console.log('[DictationScreen] Loaded saved progress:', savedProgress);
        }
      } catch (err) {
        console.error('[DictationScreen] Error loading progress:', err);
      } finally {
        setProgressLoaded(true);
      }
    };

    loadProgress();
  }, [lessonId]);

  const transcript = lesson?.transcript || [];
  const currentSentence: Sentence | undefined = transcript[currentIndex];
  const totalSentences = transcript.length;
  const progress = totalSentences > 0 ? (completedSentences.size / totalSentences) * 100 : 0;

  // Save progress to server (debounced)
  const saveProgressRef = useRef<NodeJS.Timeout | null>(null);
  const saveProgress = useCallback(() => {
    if (!progressLoaded) return; // Don't save until loaded

    // Clear previous timeout
    if (saveProgressRef.current) {
      clearTimeout(saveProgressRef.current);
    }

    // Debounce save - wait 1 second after last change
    saveProgressRef.current = setTimeout(async () => {
      try {
        await progressService.saveDictationProgress(
          lessonId,
          {
            revealedWords,
            completedSentences: Array.from(completedSentences),
            revealCount,
            currentIndex,
            userInputs,
            bonusAwarded,
          },
          studyTime
        );
        console.log('[DictationScreen] Progress saved');
      } catch (err) {
        console.error('[DictationScreen] Error saving progress:', err);
      }
    }, 1000);
  }, [lessonId, revealedWords, completedSentences, revealCount, currentIndex, userInputs, studyTime, progressLoaded, bonusAwarded]);

  // Auto-save when state changes
  useEffect(() => {
    if (progressLoaded) {
      // Update userInputs when userInput changes
      if (userInput !== (userInputs[currentIndex] || '')) {
        setUserInputs(prev => ({ ...prev, [currentIndex]: userInput }));
      }
      saveProgress();
    }

    // Cleanup timeout on unmount to prevent memory leak
    return () => {
      if (saveProgressRef.current) {
        clearTimeout(saveProgressRef.current);
      }
    };
  }, [revealedWords, completedSentences, revealCount, currentIndex, userInput, progressLoaded, saveProgress, userInputs]);

  // Check if current sentence is completed (all words correct)
  // Also handles re-edit: removes completed status if user changes answer to incorrect
  useEffect(() => {
    if (!currentSentence) return;

    const words = currentSentence.text.split(' ');
    const userWords = userInput.trim().toLowerCase().split(/\s+/).filter(w => w.length > 0);

    // Check if all words are correct (must have exact number of words)
    let allCorrect = words.length > 0 && userWords.length === words.length;
    if (allCorrect) {
      for (let i = 0; i < words.length; i++) {
        const pureWord = words[i].replace(/[.,!?;:"""''„]/g, '').toLowerCase();
        const userWord = (userWords[i] || '').replace(/[.,!?;:"""''„]/g, '');
        if (userWord !== pureWord) {
          allCorrect = false;
          break;
        }
      }
    }

    const isCurrentlyCompleted = completedSentences.has(currentIndex);
    const isReEditing = allowReEdit.has(currentIndex);

    if (allCorrect && !isCurrentlyCompleted) {
      // Newly completed - award points and mark as completed
      vibrateSuccess();
      setCompletedSentences(prev => new Set([...prev, currentIndex]));
      // Remove from re-edit mode if was re-editing
      if (isReEditing) {
        setAllowReEdit(prev => {
          const newSet = new Set(prev);
          newSet.delete(currentIndex);
          return newSet;
        });
      }

      // Award +1 point for completing sentence
      progressService.addUserPoints(1, 'dictation_sentence_complete').then(result => {
        if (result.success && result.points !== undefined) {
          updateUserPoints(result.points);
        }
      });

      // Record statistics for this single sentence (with hints tracking)
      const hintsForThisSentence = revealCount[currentIndex] || 0;
      const wordsInSentence = currentSentence.text.split(' ').length;
      console.log('[DictationScreen] Recording stats for completed sentence:', currentIndex, 'words:', wordsInSentence, 'hints:', hintsForThisSentence);
      recordDictationComplete({ wordsInSentence, hintsUsed: hintsForThisSentence, pointsEarned: 1 })
        .then(() => console.log('[DictationScreen] Stats recorded successfully'))
        .catch(err => console.error('[DictationScreen] Stats error:', err));

      // Check if ALL sentences are now completed - award lesson completion bonus
      const newCompletedSize = completedSentences.size + 1; // +1 because we just added current
      if (newCompletedSize === totalSentences && totalSentences > 0 && !bonusAwarded) {
        let bonusPoints = 0;
        if (totalSentences >= 100) {
          bonusPoints = 50;
        } else if (totalSentences >= 50) {
          bonusPoints = 20;
        }

        if (bonusPoints > 0) {
          setBonusAwarded(true);
          progressService.addUserPoints(bonusPoints, `dictation_lesson_complete_${totalSentences}_sentences`).then(result => {
            if (result.success && result.points !== undefined) {
              updateUserPoints(result.points);
              setToastType('success');
              setToastTitle(t('dictation.lessonComplete'));
              setToastMessage(t('dictation.lessonBonusMessage', { points: bonusPoints }));
              setToastVisible(true);
            }
          });
        }
      }
    } else if (!allCorrect && isCurrentlyCompleted && isReEditing) {
      // Was completed but user re-edited to incorrect - remove completed status
      vibratePartial();
      setCompletedSentences(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentIndex);
        return newSet;
      });
      console.log('[DictationScreen] Removed completed status for sentence:', currentIndex, '(re-edited to incorrect)');
    }
  }, [userInput, currentSentence, currentIndex, completedSentences, allowReEdit, updateUserPoints, revealCount, vibrateSuccess, vibratePartial, bonusAwarded, totalSentences]);

  // Play current sentence segment
  const playSentence = useCallback(() => {
    if (!currentSentence || !videoPlayerRef.current) return;

    videoPlayerRef.current.seekTo(currentSentence.startTime || currentSentence.start);
    setIsPlaying(true);
  }, [currentSentence]);

  // Handle video state changes
  const handleStateChange = useCallback((state: string) => {
    const stateNum = parseInt(state, 10);
    if (stateNum === 1) {
      setIsPlaying(true);
    } else if (stateNum === 2 || stateNum === 0) {
      setIsPlaying(false);
    }
  }, []);

  // Auto-pause at end of sentence
  useEffect(() => {
    if (!isPlaying || !currentSentence || !videoPlayerRef.current) return;

    const endTime = currentSentence.endTime || currentSentence.end;
    const checkInterval = setInterval(async () => {
      const currentTime = await videoPlayerRef.current?.getCurrentTime();
      if (currentTime && currentTime >= endTime) {
        videoPlayerRef.current?.pause();
        setIsPlaying(false);
      }
    }, 200);

    return () => clearInterval(checkInterval);
  }, [isPlaying, currentSentence]);

  // Seek video to current sentence when index changes
  useEffect(() => {
    if (currentSentence && videoPlayerRef.current && progressLoaded) {
      const startTime = currentSentence.startTime || currentSentence.start;
      videoPlayerRef.current.seekTo(startTime);
    }
  }, [currentIndex, progressLoaded, currentSentence]);

  // Go to next sentence
  const goToNext = useCallback(() => {
    if (currentIndex < totalSentences - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setUserInput(userInputs[nextIndex] || '');
    }
  }, [currentIndex, totalSentences, userInputs]);

  // Go to previous sentence
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setUserInput(userInputs[prevIndex] || '');
    }
  }, [currentIndex, userInputs]);

  // TODO: Uncomment when complete button is added to UI
  // const handleComplete = useCallback(async () => {
  //   const accuracy = Math.round(progress);
  //   const _errorCount = totalSentences - completedSentences.size;

  //   // Celebration vibration
  //   vibrateComplete();

  //   try {
  //     await progressService.saveProgress({
  //       lessonId,
  //       mode: 'dictation',
  //       completed: true,
  //       pointsEarned: 0, // Points already awarded per sentence
  //       studyTime,
  //       accuracy,
  //     });

  //     // Record study time only (sentences already tracked real-time)
  //     await recordDictationStudyTime(studyTime);

  //     Alert.alert(
  //       'Dictation Complete! 🎉',
  //       `Accuracy: ${accuracy}%\nCompleted: ${completedSentences.size}/${totalSentences} sentences\nStudy Time: ${formattedTime}`,
  //       [{ text: 'Back', onPress: () => navigation.goBack() }]
  //     );
  //   } catch {
  //     Alert.alert('Complete!', `You finished ${completedSentences.size}/${totalSentences} sentences!`,
  //       [{ text: 'Back', onPress: () => navigation.goBack() }]
  //     );
  //   }
  // }, [lessonId, progress, completedSentences.size, totalSentences, studyTime, formattedTime, navigation, vibrateComplete]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      videoPlayerRef.current?.pause();
      setIsPlaying(false);
    } else {
      playSentence();
    }
  }, [isPlaying, playSentence]);

  // Cycle through speed options
  const cycleSpeed = useCallback(() => {
    const SPEED_OPTIONS: (0.5 | 0.75 | 1 | 1.25 | 1.5 | 2)[] = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndexSpeed = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextIndex = (currentIndexSpeed + 1) % SPEED_OPTIONS.length;
    setPlaybackSpeed(SPEED_OPTIONS[nextIndex]);
  }, [playbackSpeed, setPlaybackSpeed]);

  // Handle word press for translation
  const handleWordPress = useCallback((word: string, _context: string) => {
    // Pause video before showing popup so user can read translation quietly
    if (videoPlayerRef.current) {
      videoPlayerRef.current.pause();
    }
    setIsPlaying(false);

    setSelectedWord(word);
    setSelectedContext(currentSentence?.text || '');
    setShowTranslatePopup(true);
  }, [currentSentence, setIsPlaying]);

  if (loading) return <Loading />;

  if (error || !lesson) {
    return (
      <EmptyState
        icon="close-circle"
        title="Lesson Not Found"
        message="Could not load this lesson."
        actionLabel="Go Back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  const videoId = extractVideoId(lesson.youtubeUrl);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
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

        {/* Speed Button - tap to cycle */}
        <TouchableOpacity
          style={styles.speedButton}
          onPress={cycleSpeed}
        >
          <Text style={styles.speedButtonText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
      </View>

      {/* Video Player */}
      {videoId && (
        <TouchableOpacity
          style={styles.videoContainer}
          activeOpacity={0.9}
          onPress={() => {
            if (currentSentence && videoPlayerRef.current) {
              const startTime = currentSentence.startTime || currentSentence.start;
              videoPlayerRef.current.seekTo(startTime);
              videoPlayerRef.current.play();
              setIsPlaying(true);
            }
          }}
        >
          <VideoPlayer
            ref={videoPlayerRef}
            videoId={videoId}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onStateChange={handleStateChange}
            onError={() => { }}
          />
        </TouchableOpacity>
      )}

      {/* Diktat Header - outside KeyboardAvoidingView */}
      <View style={styles.diktatSection}>
        <View style={styles.diktatTopBar} />
        <View style={styles.diktatHeader}>
          <Text style={styles.diktatTitle}>✏️ Diktat</Text>
          <View style={styles.progressWrapper}>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.counterBox}>
            <Text style={styles.counterCurrent}>{currentIndex + 1}</Text>
            <Text style={styles.counterSeparator}>/</Text>
            <Text style={styles.counterTotal}>{totalSentences}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          {/* Centered content wrapper when keyboard hidden */}
          <View style={[styles.centerWrapper, isKeyboardVisible && styles.centerWrapperKeyboard]}>
            {/* Hint box - renders for both keyboard states */}
            {currentSentence && (
              <HintBox
                sentence={currentSentence.text}
                userInput={userInput}
                currentIndex={currentIndex}
                revealedWords={revealedWords}
                revealCount={revealCount}
                userPoints={userPoints}
                isKeyboardVisible={isKeyboardVisible}
                onRevealWord={(wordKey, currentCount) => {
                  const newCount = currentCount + 1;

                  // From 3rd reveal onwards, deduct points from user
                  if (newCount > 2) {
                    progressService.addUserPoints(-1, 'dictation_hint_reveal').then(result => {
                      if (result.success && result.points !== undefined) {
                        updateUserPoints(result.points);
                        recordPointsDeducted(1);
                      }
                    });
                  }

                  vibrateHint();
                  setRevealCount(prev => ({ ...prev, [currentIndex]: newCount }));
                  setRevealedWords(prev => ({ ...prev, [wordKey]: true }));
                }}
                onWordPress={handleWordPress}
                onPointsInsufficient={() => {
                  vibrateError();
                  setToastType('warning');
                  setToastTitle(t('dictation.outOfPoints'));
                  setToastMessage(t('dictation.outOfPointsMessage'));
                  setToastVisible(true);
                }}
                onAutoFillWord={(wordIndex, word) => {
                  // Auto-fill the revealed word into input at the correct position
                  const userWords = userInput.trim().split(/\s+/).filter(w => w.length > 0);

                  // Pad userWords array to match wordIndex if needed
                  while (userWords.length < wordIndex) {
                    userWords.push('');
                  }

                  // Insert or replace the word at the correct position
                  userWords[wordIndex] = word;

                  // Join back and update input
                  const newInput = userWords.join(' ');
                  setUserInput(newInput);
                }}
              />
            )}

            {/* Input Area */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                // Single tap: focus input if editable
                if (!completedSentences.has(currentIndex) || allowReEdit.has(currentIndex)) {
                  inputRef.current?.focus();
                }
              }}
              onLongPress={() => {
                // Long press: allow re-editing completed sentence
                if (completedSentences.has(currentIndex) && !allowReEdit.has(currentIndex)) {
                  setAllowReEdit(prev => new Set([...prev, currentIndex]));
                  setTimeout(() => inputRef.current?.focus(), 100);
                }
              }}
              delayLongPress={300}
            >
              <View style={[
                styles.inputContainer,
                isKeyboardVisible && styles.inputContainerKeyboard,
                completedSentences.has(currentIndex) && !allowReEdit.has(currentIndex) && styles.inputContainerCompleted
              ]}>
                <TextInput
                  ref={inputRef}
                  style={[styles.textInput, isKeyboardVisible && styles.textInputKeyboard]}
                  placeholder="Type what you hear..."
                  placeholderTextColor={colors.textMuted}
                  value={userInput}
                  onChangeText={(text) => {
                    if (completedSentences.has(currentIndex) && !allowReEdit.has(currentIndex)) return;

                    // Relaxed validation - only limit total words and total characters
                    if (currentSentence) {
                      const expectedWords = currentSentence.text.split(' ');
                      const userWords = text.trim().split(/\s+/).filter(w => w.length > 0);

                      // Don't allow more words than expected
                      if (userWords.length > expectedWords.length) {
                        return;
                      }

                      // Calculate max total characters (sum of all expected word lengths + spaces)
                      const maxTotalChars = expectedWords.reduce((sum, w) => {
                        const pureWord = w.replace(/[.,!?;:"""''„]/g, '');
                        return sum + pureWord.length;
                      }, 0) + expectedWords.length; // +length for spaces between words

                      // Don't allow input to exceed max total characters
                      if (text.length > maxTotalChars) {
                        return;
                      }
                    }

                    setUserInput(text);
                  }}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!completedSentences.has(currentIndex) || allowReEdit.has(currentIndex)}
                />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>

        {/* Bottom Controls - Inside KeyboardAvoidingView to move with keyboard */}
        <View style={[
          styles.bottomControls,
          { paddingBottom: isKeyboardVisible ? 4 : (insets.bottom || 14) },
          isKeyboardVisible && styles.bottomControlsKeyboard
        ]}>
          {/* Previous - Left edge */}
          <TouchableOpacity
            style={[styles.controlBtn, styles.controlBtnNavEdge, currentIndex === 0 && styles.controlBtnDisabled]}
            onPress={goToPrevious}
            disabled={currentIndex === 0}
          >
            <Icon name="chevron-back" size={24} color={currentIndex === 0 ? colors.textMuted : colors.retroDark} />
          </TouchableOpacity>

          {/* Center Controls */}
          <View style={styles.centerControls}>
            {/* Replay Current Sentence */}
            <TouchableOpacity
              style={[styles.controlBtn, styles.controlBtnReplay]}
              onPress={playSentence}
            >
              <Icon name="refresh" size={22} color="#fff" />
            </TouchableOpacity>

            {/* Play/Pause - Center Large */}
            <TouchableOpacity
              style={[styles.controlBtn, styles.controlBtnPlay]}
              onPress={togglePlayPause}
            >
              <Icon name={isPlaying ? 'pause' : 'play'} size={28} color="#fff" style={!isPlaying && { marginLeft: 3 }} />
            </TouchableOpacity>
          </View>

          {/* Next - Right edge */}
          <TouchableOpacity
            style={[styles.controlBtn, styles.controlBtnNavEdge, currentIndex >= totalSentences - 1 && styles.controlBtnDisabled]}
            onPress={goToNext}
            disabled={currentIndex >= totalSentences - 1}
          >
            <Icon name="chevron-forward" size={24} color={currentIndex >= totalSentences - 1 ? colors.textMuted : colors.retroDark} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Word Translation Popup */}
      <WordTranslatePopup
        visible={showTranslatePopup}
        word={selectedWord}
        context={selectedContext}
        lessonId={lessonId}
        lessonTitle={lesson?.title}
        onClose={() => setShowTranslatePopup(false)}
      />

      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        type={toastType}
        title={toastTitle}
        message={toastMessage}
        duration={3500}
        onDismiss={() => setToastVisible(false)}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  speedButton: {
    backgroundColor: colors.retroCyan,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 2,
  },
  speedButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
  },
  videoContainer: {
    height: 200,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  centerWrapperKeyboard: {
    justifyContent: 'flex-end',
  },
  // Diktat Header Section - like Shadowing
  diktatSection: {
    backgroundColor: '#fff',
  },
  diktatTopBar: {
    height: 4,
    backgroundColor: colors.retroPurple,
  },
  diktatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: 'rgba(155, 89, 182, 0.08)',
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
  },
  diktatTitle: {
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: colors.retroPurple,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
    color: '#fff',
  },
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
    backgroundColor: colors.retroPurple,
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
  // HintBox styles moved to components/dictation/HintBox.tsx
  inputContainer: {
    backgroundColor: colors.retroCream,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 3,
  },
  inputContainerKeyboard: {
    marginHorizontal: spacing.sm,
    marginBottom: 6,
    borderRadius: 12,
  },
  inputContainerCompleted: {
    backgroundColor: '#d4edda',
    borderColor: colors.success,
  },
  textInput: {
    padding: 18,
    fontSize: 17,
    color: colors.retroDark,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  textInputKeyboard: {
    minHeight: 60,
    padding: 12,
  },
  resultBox: {
    padding: 16,
    borderRadius: 16,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  resultSuccess: {
    backgroundColor: '#d4edda',
  },
  resultError: {
    backgroundColor: '#f8d7da',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.retroDark,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.retroDark,
    marginBottom: 4,
  },
  resultFeedback: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  correctAnswer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.retroBorder,
  },
  correctLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.retroDark,
    marginBottom: 4,
  },
  correctText: {
    fontSize: 15,
    color: colors.retroDark,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.retroBorder,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 2,
  },
  hintButton: {
    backgroundColor: colors.retroCream,
  },
  checkButton: {
    backgroundColor: colors.retroCyan,
  },
  retryButton: {
    backgroundColor: colors.retroCream,
  },
  nextButton: {
    backgroundColor: colors.retroCoral,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.retroDark,
  },
  checkButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  // Bottom Controls - Fixed Bar
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.retroCream,
    borderTopWidth: 1,
    borderTopColor: colors.retroBorder,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bottomControlsKeyboard: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    paddingVertical: 6,
  },
  controlBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.retroBorder,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 2,
  },
  controlBtnNav: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.retroPurple,
  },
  controlBtnNavEdge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
  },
  controlBtnReplay: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.retroCoral,
  },
  controlBtnPlay: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.retroCyan,
    borderWidth: 3,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
  },
  controlBtnDisabled: {
    backgroundColor: colors.retroCream,
    opacity: 0.5,
  },
});

export default DictationScreen;
