// DictationScreen - Neo-Retro Design
// Full dictation practice with video, transcript, and word-by-word input

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useLessonData } from '../hooks/useLessonData';
import { useStudyTimer } from '../hooks/useStudyTimer';
import VideoPlayer, { VideoPlayerRef } from '../components/player/VideoPlayer';
import { Loading } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { progressService } from '../services/progress.service';
import { extractVideoId } from '../utils/youtube';
import { compareTexts, getSimilarityFeedback } from '../utils/textSimilarity';
import { useSettings } from '../contexts/SettingsContext';
import { colors, spacing } from '../styles/theme';
import WordTranslatePopup from '../components/common/WordTranslatePopup';
import type { HomeStackScreenProps } from '../navigation/types';
import type { Sentence } from '../types/lesson.types';

type DictationScreenProps = HomeStackScreenProps<'Dictation'>;

const DictationScreen: React.FC<DictationScreenProps> = ({ route, navigation }) => {
  const { lessonId } = route.params;
  const { lesson, loading, error } = useLessonData(lessonId);
  const { settings } = useSettings();
  const parentNavigation = useNavigation().getParent();
  const insets = useSafeAreaInsets();
  
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const inputRef = useRef<TextInput>(null);
  
  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSentences, setCompletedSentences] = useState<Set<number>>(new Set());
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [revealedWords, setRevealedWords] = useState<{[key: string]: boolean}>({});
  const [revealCount, setRevealCount] = useState<{[key: number]: number}>({}); // Track reveals per sentence
  const [pointsDeducted, setPointsDeducted] = useState(0); // Total points deducted
  
  // Word translation popup state
  const [selectedWord, setSelectedWord] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const [showTranslatePopup, setShowTranslatePopup] = useState(false);

  // Study timer
  const { studyTime, formattedTime, isTimerRunning } = useStudyTimer({
    isPlaying,
    lessonId,
    mode: 'dictation',
  });

  // Haptic feedback functions (only vibrate if enabled in settings)
  const vibrateSuccess = () => {
    if (!settings.hapticEnabled) return;
    Vibration.vibrate(50);
  };

  const vibrateError = () => {
    if (!settings.hapticEnabled) return;
    Vibration.vibrate([0, 50, 50, 50]);
  };

  const vibrateHint = () => {
    if (!settings.hapticEnabled) return;
    Vibration.vibrate(30);
  };

  const vibrateComplete = () => {
    if (!settings.hapticEnabled) return;
    Vibration.vibrate([0, 100, 50, 100, 50, 100]);
  };

  const vibratePartial = () => {
    if (!settings.hapticEnabled) return;
    Vibration.vibrate(40);
  };

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

  const transcript = lesson?.transcript || [];
  const currentSentence: Sentence | undefined = transcript[currentIndex];
  const totalSentences = transcript.length;
  const progress = totalSentences > 0 ? (completedSentences.size / totalSentences) * 100 : 0;

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

  // Go to next sentence
  const goToNext = useCallback(() => {
    if (currentIndex < totalSentences - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
    }
  }, [currentIndex, totalSentences]);

  // Go to previous sentence
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setUserInput('');
    }
  }, [currentIndex]);

  // Save progress on complete
  const handleComplete = useCallback(async () => {
    const accuracy = Math.round(progress);
    const basePoints = Math.floor(completedSentences.size * 2);
    const finalPoints = Math.max(0, basePoints - pointsDeducted);

    // Celebration vibration
    vibrateComplete();

    try {
      await progressService.saveProgress({
        lessonId,
        mode: 'dictation',
        completed: true,
        pointsEarned: finalPoints,
        studyTime,
        accuracy,
      });

      Alert.alert(
        'Dictation Complete! 🎉',
        `Accuracy: ${accuracy}%\nPoints Earned: ${finalPoints}${pointsDeducted > 0 ? ` (-${pointsDeducted} hint)` : ''}\nStudy Time: ${formattedTime}`,
        [{ text: 'Back', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Complete!', `You finished ${completedSentences.size}/${totalSentences} sentences!`, 
        [{ text: 'Back', onPress: () => navigation.goBack() }]
      );
    }
  }, [lessonId, progress, completedSentences.size, totalSentences, studyTime, formattedTime, pointsDeducted, navigation]);

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
  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const cycleSpeed = useCallback(() => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    setPlaybackSpeed(SPEED_OPTIONS[nextIndex]);
  }, [playbackSpeed]);

  // Handle word press for translation
  const handleWordPress = useCallback((word: string, pureWord: string) => {
    setSelectedWord(pureWord);
    setSelectedContext(currentSentence?.text || '');
    setShowTranslatePopup(true);
  }, [currentSentence]);

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
        <View style={styles.videoContainer}>
          <VideoPlayer
            ref={videoPlayerRef}
            videoId={videoId}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onStateChange={handleStateChange}
            onError={() => {}}
          />
        </View>
      )}

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {completedSentences.size}/{totalSentences} sentences
            </Text>
          </View>

          {/* Sentence Counter */}
          <View style={styles.sentenceHeader}>
            <Text style={styles.sentenceNumber}>
              #{currentIndex + 1}
              <Text style={styles.sentenceTotal}> / {totalSentences}</Text>
            </Text>
          </View>

          {/* Masked Sentence Hint */}
          {currentSentence && (
            <View style={styles.maskedSentenceBox}>
              <View style={styles.hintHeader}>
                <Text style={styles.maskedLabel}>💡 Hint</Text>
                <Text style={[
                  styles.freeHintText,
                  (revealCount[currentIndex] || 0) >= 2 && styles.freeHintWarning
                ]}>
                  {(revealCount[currentIndex] || 0) >= 2 ? '-1đ/lần' : `${2 - (revealCount[currentIndex] || 0)}x free`}
                </Text>
              </View>
              <View style={styles.maskedWordsContainer}>
                {currentSentence.text.split(' ').map((word, index) => {
                  const pureWord = word.replace(/[.,!?;:"""''„]/g, '');
                  const punctuation = word.replace(pureWord, '');
                  const wordKey = `${currentIndex}-${index}`;
                  const isRevealedByClick = revealedWords[wordKey];
                  
                  // Check user input for this word position
                  const userWords = userInput.trim().toLowerCase().split(/\s+/).filter(w => w.length > 0);
                  const userWord = userWords[index]?.replace(/[.,!?;:"""''„]/g, '') || '';
                  const correctWord = pureWord.toLowerCase();
                  
                  // Calculate matched characters from start
                  let matchedChars = 0;
                  for (let i = 0; i < Math.min(userWord.length, correctWord.length); i++) {
                    if (userWord[i] === correctWord[i]) {
                      matchedChars++;
                    } else {
                      break;
                    }
                  }
                  
                  const isFullyCorrect = userWord === correctWord;
                  const isWrong = userWord.length > 0 && matchedChars === 0;
                  const hasPartialMatch = matchedChars > 0 && !isFullyCorrect;
                  
                  // Handle tap to reveal
                  const handleReveal = () => {
                    if (!isFullyCorrect && !isRevealedByClick) {
                      const currentCount = revealCount[currentIndex] || 0;
                      const newCount = currentCount + 1;
                      
                      // Haptic feedback for hint
                      vibrateHint();
                      
                      // Update reveal count for this sentence
                      setRevealCount(prev => ({ ...prev, [currentIndex]: newCount }));
                      
                      // Deduct 1 point from 3rd reveal onwards
                      if (newCount > 2) {
                        setPointsDeducted(prev => prev + 1);
                      }
                      
                      setRevealedWords(prev => ({ ...prev, [wordKey]: true }));
                    }
                  };
                  
                  return (
                    <View key={index} style={styles.maskedWordWrapper}>
                      {isFullyCorrect || isRevealedByClick ? (
                        // Revealed - show word (clickable for translation)
                        <TouchableOpacity 
                          style={[styles.wordBox, styles.wordBoxRevealed]}
                          onPress={() => handleWordPress(word, pureWord)}
                        >
                          <Text style={styles.revealedWord}>{pureWord}</Text>
                        </TouchableOpacity>
                      ) : isWrong ? (
                        // Wrong - red box
                        <TouchableOpacity style={[styles.wordBox, styles.wordBoxWrong]} onPress={handleReveal}>
                          <Text style={styles.wrongAsterisks}>
                            {'*'.repeat(pureWord.length)}
                          </Text>
                        </TouchableOpacity>
                      ) : hasPartialMatch ? (
                        // Partial match
                        <TouchableOpacity style={[styles.wordBox, styles.wordBoxPartial]} onPress={handleReveal}>
                          <Text style={styles.matchedChars}>
                            {pureWord.substring(0, matchedChars)}
                          </Text>
                          <Text style={styles.remainingAsterisks}>
                            {'*'.repeat(pureWord.length - matchedChars)}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        // Not started - hidden box
                        <TouchableOpacity style={[styles.wordBox, styles.wordBoxHidden]} onPress={handleReveal}>
                          <Text style={styles.hiddenAsterisks}>
                            {'*'.repeat(pureWord.length)}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {punctuation && <Text style={styles.punctuation}>{punctuation}</Text>}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Type what you hear..."
              placeholderTextColor={colors.textMuted}
              value={userInput}
              onChangeText={setUserInput}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>


        </ScrollView>

        {/* Bottom Controls - Inside KeyboardAvoidingView to move with keyboard */}
        <View style={[styles.bottomControls, { paddingBottom: insets.bottom || 14 }]}>
          {/* Previous */}
          <TouchableOpacity 
            style={[styles.controlBtn, styles.controlBtnNav, currentIndex === 0 && styles.controlBtnDisabled]}
            onPress={goToPrevious}
            disabled={currentIndex === 0}
          >
            <Icon name="chevron-back" size={24} color={currentIndex === 0 ? colors.textMuted : '#fff'} />
          </TouchableOpacity>

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

          {/* Next */}
          <TouchableOpacity 
            style={[styles.controlBtn, styles.controlBtnNav, currentIndex >= totalSentences - 1 && styles.controlBtnDisabled]}
            onPress={goToNext}
            disabled={currentIndex >= totalSentences - 1}
          >
            <Icon name="chevron-forward" size={24} color={currentIndex >= totalSentences - 1 ? colors.textMuted : '#fff'} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 20,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.retroCream,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.retroCyan,
  },
  progressText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  sentenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sentenceNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.retroPurple,
  },
  sentenceTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMuted,
  },
  maskedSentenceBox: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 10,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.retroBorder,
  },
  hintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  maskedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  freeHintText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: colors.retroCyan,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.retroBorder,
    overflow: 'hidden',
  },
  freeHintWarning: {
    backgroundColor: colors.retroCoral,
  },
  maskedWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  maskedWordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordBox: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordBoxHidden: {
    backgroundColor: colors.retroCream,
    borderColor: colors.retroBorder,
  },
  wordBoxWrong: {
    backgroundColor: '#ffe0e0',
    borderColor: colors.retroCoral,
  },
  wordBoxPartial: {
    backgroundColor: '#e0f7fa',
    borderColor: colors.retroCyan,
  },
  wordBoxRevealed: {
    backgroundColor: '#e8f5e9',
    borderColor: colors.retroCyan,
  },
  hiddenAsterisks: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  wrongAsterisks: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.retroCoral,
    letterSpacing: 1,
  },
  matchedChars: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.retroCyan,
  },
  remainingAsterisks: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  revealedWord: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.retroCyan,
  },
  punctuation: {
    fontSize: 12,
    color: colors.retroDark,
    marginLeft: 1,
  },
  inputContainer: {
    backgroundColor: colors.retroCream,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.retroBorder,
    marginBottom: spacing.md,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 3,
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    color: colors.retroDark,
    minHeight: 100,
    textAlignVertical: 'top',
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
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.retroCream,
    borderTopWidth: 2,
    borderTopColor: colors.retroBorder,
    gap: 20,
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
