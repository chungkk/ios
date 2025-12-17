import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DictationInput from '../components/dictation/DictationInput';
import DictationFeedback from '../components/dictation/DictationFeedback';
import SentenceNavigator from '../components/dictation/SentenceNavigator';
import ProgressIndicator from '../components/dictation/ProgressIndicator';
import useDictation from '../hooks/useDictation';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import progressService from '../services/progress.service';
import { colors, spacing, borderRadius } from '../styles/theme';
import { Lesson } from '../types/lesson.types';

type RootStackParamList = {
  Dictation: { lesson: Lesson };
};

type DictationScreenRouteProp = RouteProp<RootStackParamList, 'Dictation'>;
type DictationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dictation'>;

interface DictationScreenProps {
  route: DictationScreenRouteProp;
  navigation: DictationScreenNavigationProp;
}

/**
 * DictationScreen
 * Full dictation practice mode with sentence-by-sentence playback,
 * answer checking, voice input, and progress tracking
 */
const DictationScreen: React.FC<DictationScreenProps> = ({ route, navigation }) => {
  const { lesson } = route.params;
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Dictation logic
  const {
    currentSentence,
    currentSentenceIndex,
    totalSentences,
    userInput,
    checkResult,
    isSubmitted,
    completedCount,
    progress,
    setUserInput,
    submitAnswer,
    nextSentence,
    previousSentence,
    resetAnswer,
    canGoBack,
    canGoNext,
    hasAnswer,
  } = useDictation({
    sentences: lesson.transcript,
    onComplete: handleSessionComplete,
  });

  // Voice recognition
  const {
    isListening,
    recognizedText,
    startListening,
    stopListening,
    clearResults,
  } = useSpeechRecognition({
    language: 'de-DE',
    onResult: (text) => {
      setUserInput(text);
      stopListening();
    },
    onError: (error) => {
      Alert.alert('Voice Recognition Error', error);
      stopListening();
    },
  });

  // Update input when voice recognition completes
  useEffect(() => {
    if (recognizedText && !isListening) {
      setUserInput(recognizedText);
      clearResults();
    }
  }, [recognizedText, isListening]);

  /**
   * Handle session completion - track progress and award points
   */
  async function handleSessionComplete(accuracy: number, pointsEarned: number) {
    try {
      // T093: Track dictation progress and award points
      await progressService.saveProgress({
        lessonId: lesson.id,
        mode: 'dictation',
        completed: true,
        pointsEarned,
        studyTime: 0, // TODO: Track actual study time
        accuracy,
      });

      Alert.alert(
        'Dictation Complete! 🎉',
        `Accuracy: ${accuracy}%\nPoints Earned: ${pointsEarned}`,
        [
          {
            text: 'Back to Lessons',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save progress:', error);
      Alert.alert('Error', 'Failed to save your progress');
    }
  }

  /**
   * T090: Play current sentence audio (loop)
   * Note: This is a placeholder - actual audio playback would use
   * react-native-sound or react-native-track-player
   */
  const playSentenceAudio = () => {
    if (!currentSentence) return;

    setIsPlayingAudio(true);
    console.log('Playing sentence:', currentSentence.text);
    
    // TODO: Implement actual audio playback
    // Example: Play video segment from startTime to endTime
    // Or use separate audio file if available
    
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 3000);
  };

  /**
   * T091: Submit answer and check
   */
  const handleSubmit = () => {
    submitAnswer();
  };

  /**
   * T092: Handle voice input
   */
  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dictation Practice</Text>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
        </View>

        {/* Progress Indicator */}
        <ProgressIndicator
          completedCount={completedCount}
          totalCount={totalSentences}
          progress={progress}
        />

        {/* Current Sentence Display */}
        <View style={styles.sentenceContainer}>
          <Text style={styles.sentenceLabel}>Sentence {currentSentenceIndex + 1}:</Text>
          
          {/* T090: Audio Player Controls */}
          <TouchableOpacity
            style={styles.audioButton}
            onPress={playSentenceAudio}
            disabled={isPlayingAudio}
            activeOpacity={0.7}
          >
            <Text style={styles.audioIcon}>{isPlayingAudio ? '⏸️' : '▶️'}</Text>
            <Text style={styles.audioButtonText}>
              {isPlayingAudio ? 'Playing...' : 'Play Sentence'}
            </Text>
          </TouchableOpacity>

          {/* Show expected sentence after submission */}
          {isSubmitted && currentSentence && (
            <View style={styles.expectedSentence}>
              <Text style={styles.expectedLabel}>Expected:</Text>
              <Text style={styles.expectedText}>{currentSentence.text}</Text>
            </View>
          )}
        </View>

        {/* Dictation Input */}
        <DictationInput
          value={userInput}
          onChangeText={setUserInput}
          editable={!isSubmitted}
          onSubmit={hasAnswer && !isSubmitted ? handleSubmit : undefined}
          onVoiceInput={handleVoiceInput}
          isListening={isListening}
        />

        {/* T091: Feedback Display */}
        {isSubmitted && checkResult && (
          <View style={styles.feedbackContainer}>
            <DictationFeedback
              result={checkResult}
              expectedSentence={currentSentence?.text || ''}
            />
          </View>
        )}

        {/* Action Buttons */}
        {isSubmitted && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={resetAnswer}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>🔄 Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sentence Navigator */}
        <SentenceNavigator
          currentIndex={currentSentenceIndex}
          totalSentences={totalSentences}
          onPrevious={previousSentence}
          onNext={nextSentence}
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          isSubmitted={isSubmitted}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  lessonTitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  sentenceContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.medium,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sentenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentBlue,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.small,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  audioIcon: {
    fontSize: 20,
  },
  audioButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  expectedSentence: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderColor,
  },
  expectedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  expectedText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  feedbackContainer: {
    marginVertical: spacing.lg,
  },
  actionsContainer: {
    marginVertical: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.bgSecondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.small,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

export default DictationScreen;
