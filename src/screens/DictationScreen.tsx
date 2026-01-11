// DictationScreen - Neo-Retro Design
// Full dictation practice with video, transcript, and word-by-word input

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useLessonData } from '../hooks/useLessonData';
import VideoPlayer, { VideoPlayerRef } from '../components/player/VideoPlayer';
import { Loading } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { progressService } from '../services/progress.service';
import { extractVideoId } from '../utils/youtube';
import { compareTexts, getSimilarityFeedback } from '../utils/textSimilarity';
import { colors, spacing } from '../styles/theme';
import type { HomeStackScreenProps } from '../navigation/types';
import type { Sentence } from '../types/lesson.types';

type DictationScreenProps = HomeStackScreenProps<'Dictation'>;

const DictationScreen: React.FC<DictationScreenProps> = ({ route, navigation }) => {
  const { lessonId } = route.params;
  const { lesson, loading, error } = useLessonData(lessonId);
  
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const inputRef = useRef<TextInput>(null);
  
  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [completedSentences, setCompletedSentences] = useState<Set<number>>(new Set());
  const [studyStartTime] = useState(Date.now());

  // Hide navigation
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ tabBarStyle: { display: 'none' } });
    }
    return () => {
      if (parent) {
        parent.setOptions({ tabBarStyle: undefined });
      }
    };
  }, [navigation]);

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

  // Check answer
  const checkAnswer = useCallback(() => {
    if (!currentSentence || !userInput.trim()) return;

    const result = compareTexts(currentSentence.text, userInput.trim());
    setCheckResult(result);
    setShowResult(true);

    if (result.isPassed) {
      setCompletedSentences(prev => new Set([...prev, currentIndex]));
    }
  }, [currentSentence, userInput, currentIndex]);

  // Go to next sentence
  const goToNext = useCallback(() => {
    if (currentIndex < totalSentences - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setShowResult(false);
      setCheckResult(null);
    }
  }, [currentIndex, totalSentences]);

  // Go to previous sentence
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setUserInput('');
      setShowResult(false);
      setCheckResult(null);
    }
  }, [currentIndex]);

  // Show answer
  const showAnswer = useCallback(() => {
    if (currentSentence) {
      setUserInput(currentSentence.text);
    }
  }, [currentSentence]);

  // Retry current sentence
  const retry = useCallback(() => {
    setUserInput('');
    setShowResult(false);
    setCheckResult(null);
  }, []);

  // Save progress on complete
  const handleComplete = useCallback(async () => {
    const studyTime = Math.floor((Date.now() - studyStartTime) / 1000);
    const accuracy = Math.round(progress);
    const pointsEarned = Math.floor(completedSentences.size * 2);

    try {
      await progressService.saveProgress({
        lessonId,
        mode: 'dictation',
        completed: true,
        pointsEarned,
        studyTime,
        accuracy,
      });

      Alert.alert(
        'Dictation Complete! 🎉',
        `Accuracy: ${accuracy}%\nPoints Earned: ${pointsEarned}`,
        [{ text: 'Back', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Complete!', `You finished ${completedSentences.size}/${totalSentences} sentences!`, 
        [{ text: 'Back', onPress: () => navigation.goBack() }]
      );
    }
  }, [lessonId, progress, completedSentences.size, totalSentences, studyStartTime, navigation]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      videoPlayerRef.current?.pause();
      setIsPlaying(false);
    } else {
      playSentence();
    }
  }, [isPlaying, playSentence]);

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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={22} color={colors.retroCyan} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Dictation</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Video Player */}
      {videoId && (
        <View style={styles.videoContainer}>
          <VideoPlayer
            ref={videoPlayerRef}
            videoId={videoId}
            isPlaying={isPlaying}
            playbackSpeed={1}
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

          {/* Translation hint */}
          {currentSentence?.translation && (
            <View style={styles.translationBox}>
              <Text style={styles.translationLabel}>💡 Hint:</Text>
              <Text style={styles.translationText}>{currentSentence.translation}</Text>
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
              editable={!showResult}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Result Display */}
          {showResult && checkResult && (
            <View style={[
              styles.resultBox,
              checkResult.isPassed ? styles.resultSuccess : styles.resultError
            ]}>
              <Text style={styles.resultTitle}>
                {checkResult.isPassed ? '✅ Correct!' : '❌ Try Again'}
              </Text>
              <Text style={styles.resultScore}>
                Accuracy: {Math.round(checkResult.overallSimilarity)}%
              </Text>
              <Text style={styles.resultFeedback}>
                {getSimilarityFeedback(checkResult.overallSimilarity, 'en')}
              </Text>
              
              {/* Show correct answer if wrong */}
              {!checkResult.isPassed && (
                <View style={styles.correctAnswer}>
                  <Text style={styles.correctLabel}>Correct answer:</Text>
                  <Text style={styles.correctText}>{currentSentence?.text}</Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {!showResult ? (
              <>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.hintButton]} 
                  onPress={showAnswer}
                >
                  <Text style={styles.actionButtonText}>👁️ Show</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.checkButton]} 
                  onPress={checkAnswer}
                  disabled={!userInput.trim()}
                >
                  <Text style={styles.checkButtonText}>Check ✓</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.retryButton]} 
                  onPress={retry}
                >
                  <Text style={styles.actionButtonText}>🔄 Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.nextButton]} 
                  onPress={currentIndex < totalSentences - 1 ? goToNext : handleComplete}
                >
                  <Text style={styles.nextButtonText}>
                    {currentIndex < totalSentences - 1 ? 'Next →' : 'Finish 🎉'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Controls - Fixed */}
      <View style={styles.bottomControls}>
        {/* Previous */}
        <TouchableOpacity 
          style={[styles.controlBtn, styles.controlBtnNav, currentIndex === 0 && styles.controlBtnDisabled]}
          onPress={goToPrevious}
          disabled={currentIndex === 0}
        >
          <Icon name="chevron-back" size={24} color={currentIndex === 0 ? colors.textMuted : '#fff'} />
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
    </SafeAreaView>
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
    padding: 6,
  },
  backText: {
    fontSize: 15,
    color: colors.retroCyan,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.retroDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 60,
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
  translationBox: {
    backgroundColor: colors.retroYellow,
    padding: 12,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.retroBorder,
  },
  translationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.retroDark,
    marginBottom: 4,
  },
  translationText: {
    fontSize: 14,
    color: colors.retroDark,
    fontStyle: 'italic',
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
