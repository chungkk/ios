// ListeningFlowScreen - Combined Listening + Speaking Flow
// Step 1: Listen (with optional transcript toggle)
// Step 2: Shadowing (repeat 10-15 times per sentence)

import React, { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useLessonData } from '../hooks/useLessonData';
import AudioPlayer, { AudioPlayerRef } from '../components/player/AudioPlayer';
import VideoPlayer, { VideoPlayerRef } from '../components/player/VideoPlayer';
import { extractVideoId } from '../utils/youtube';
import { BASE_URL } from '../services/api';
import { Loading } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { useSettings } from '../contexts/SettingsContext';
import { colors, spacing } from '../styles/theme';
import type { ListenSpeakStackScreenProps } from '../navigation/types';
import type { Sentence } from '../types/lesson.types';

type Props = ListenSpeakStackScreenProps<'ListeningFlow'>;

const SHADOWING_TARGET = 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FlowStep = 'listen' | 'shadowing';

const STEP_CONFIG = {
  listen: { label: 'Nghe', icon: 'ear-outline', color: colors.retroCyan },
  shadowing: { label: 'Shadowing', icon: 'mic-outline', color: colors.retroPurple },
};

const ListeningFlowScreen: React.FC<Props> = ({ route, navigation }) => {
  const { lessonId } = route.params;
  const { lesson, loading, error } = useLessonData(lessonId);
  const { settings } = useSettings();
  const { t } = useTranslation();
  const parentNavigation = useNavigation().getParent();
  const insets = useSafeAreaInsets();

  const playerRef = useRef<AudioPlayerRef & VideoPlayerRef>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const sentenceLayoutsRef = useRef<{ [key: number]: number }>({});

  // Flow state
  const [currentStep, setCurrentStep] = useState<FlowStep>('listen');
  const [showTranscript, setShowTranscript] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 0.75 | 1 | 1.25 | 1.5 | 2>(1);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [shadowingCounts, setShadowingCounts] = useState<{ [key: number]: number }>({});

  // Hide tab bar when in this screen
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
    parentNavigation?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
      parentNavigation?.setOptions({
        tabBarStyle: {
          backgroundColor: colors.retroCream,
          borderTopColor: colors.retroBorder,
          borderTopWidth: 3,
          height: 75,
          paddingBottom: 14,
          paddingTop: 10,
          display: 'flex',
        },
      });
    };
  }, [navigation, parentNavigation]);

  const sentences = lesson?.transcript || [];

  // Sync transcript with playback
  useEffect(() => {
    if (!isPlaying || sentences.length === 0) return;

    const interval = setInterval(async () => {
      if (!playerRef.current) return;
      try {
        const currentTime = await playerRef.current.getCurrentTime();
        for (let i = sentences.length - 1; i >= 0; i--) {
          if (currentTime >= sentences[i].startTime) {
            setCurrentSentenceIndex(i);
            break;
          }
        }
      } catch (e) {
        // ignore
      }
    }, 300);

    return () => clearInterval(interval);
  }, [isPlaying, sentences]);

  // Auto-scroll transcript to active sentence
  useEffect(() => {
    const y = sentenceLayoutsRef.current[currentSentenceIndex];
    if (y !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: Math.max(0, y - 40), animated: true });
    }
  }, [currentSentenceIndex]);

  const handleGoBack = useCallback(() => {
    if (currentStep === 'shadowing') {
      setCurrentStep('listen');
      setIsPlaying(false);
    } else {
      navigation.goBack();
    }
  }, [currentStep, navigation]);

  const handleNextStep = useCallback(() => {
    if (currentStep === 'listen') {
      setCurrentStep('shadowing');
      setIsPlaying(false);
      setCurrentSentenceIndex(0);
    }
  }, [currentStep]);

  const handleShadowingRepeat = useCallback(() => {
    const newCounts = { ...shadowingCounts };
    newCounts[currentSentenceIndex] = (newCounts[currentSentenceIndex] || 0) + 1;
    setShadowingCounts(newCounts);

    // Auto-advance if target reached
    if (newCounts[currentSentenceIndex] >= SHADOWING_TARGET && currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
    }
  }, [shadowingCounts, currentSentenceIndex, sentences.length]);

  const handlePlaySentence = useCallback(async () => {
    const sentence = sentences[currentSentenceIndex];
    if (!sentence || !playerRef.current) return;

    playerRef.current.seekTo(sentence.start);
    playerRef.current.play();
    setIsPlaying(true);

    // Auto-pause at end of sentence
    const duration = (sentence.end - sentence.start) * 1000;
    setTimeout(() => {
      playerRef.current?.pause();
      setIsPlaying(false);
    }, duration / playbackSpeed);
  }, [sentences, currentSentenceIndex, playbackSpeed]);

  const handleAudioEnd = useCallback(() => {
    setIsPlaying(false);
  }, []);

  if (loading) return <Loading />;
  if (error || !lesson) return <EmptyState title="Lỗi" message="Không tải được bài học" />;

  const videoId = lesson.youtubeUrl ? extractVideoId(lesson.youtubeUrl) : null;
  const isAudioLesson = !videoId;
  const audioUrl = lesson.audioFileUrl || lesson.audio || '';
  const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `${BASE_URL}${audioUrl}`;

  const currentSentence = sentences[currentSentenceIndex];
  const stepConfig = STEP_CONFIG[currentStep];
  const totalShadowingDone = Object.values(shadowingCounts).reduce((sum, c) => sum + c, 0);
  const totalShadowingTarget = sentences.length * SHADOWING_TARGET;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title}</Text>
          <View style={[styles.stepBadge, { backgroundColor: stepConfig.color }]}>
            <Icon name={stepConfig.icon} size={14} color="#fff" />
            <Text style={styles.stepBadgeText}>{stepConfig.label}</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Step Progress */}
      <View style={styles.stepProgress}>
        {(['listen', 'shadowing'] as FlowStep[]).map((step, i) => (
          <View
            key={step}
            style={[
              styles.stepDot,
              currentStep === step && styles.stepDotActive,
              (['listen', 'shadowing'].indexOf(currentStep) > i) && styles.stepDotCompleted,
            ]}
          />
        ))}
      </View>

      {/* Player */}
      <View style={styles.playerContainer}>
        {isAudioLesson ? (
          <AudioPlayer
            ref={playerRef}
            audioUrl={fullAudioUrl}
            thumbnailUrl={lesson.thumbnail}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onStateChange={(state) => {
              if (state === 'ended') handleAudioEnd();
            }}
          />
        ) : (
          <VideoPlayer
            ref={playerRef}
            videoId={videoId!}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onStateChange={(state) => {
              const stateNum = parseInt(state, 10);
              if (stateNum === 0) handleAudioEnd();
            }}
          />
        )}
      </View>

      {/* Content Area - depends on step */}
      <View style={styles.contentArea}>
        {currentStep === 'listen' && (
          <View style={styles.listenContent}>
            {/* Toggle Transcript */}
            <TouchableOpacity
              style={styles.toggleTranscriptButton}
              onPress={() => setShowTranscript(!showTranscript)}
            >
              <Icon
                name={showTranscript ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textPrimary}
              />
              <Text style={styles.toggleTranscriptText}>
                {showTranscript ? 'Ẩn Transcript' : 'Hiện Transcript'}
              </Text>
            </TouchableOpacity>

            {showTranscript ? (
              <ScrollView ref={scrollViewRef} style={styles.transcriptScroll} showsVerticalScrollIndicator={false}>
                {sentences.map((sentence, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.sentenceRow,
                      currentSentenceIndex === index && styles.sentenceRowActive,
                    ]}
                    onLayout={(e) => {
                      sentenceLayoutsRef.current[index] = e.nativeEvent.layout.y;
                    }}
                    onPress={() => {
                      setCurrentSentenceIndex(index);
                      playerRef.current?.seekTo(sentence.start);
                      playerRef.current?.play();
                      setIsPlaying(true);
                    }}
                  >
                    <Text style={[
                      styles.sentenceText,
                      currentSentenceIndex === index && styles.sentenceTextActive,
                    ]}>
                      {sentence.text}
                    </Text>
                    {sentence.translation ? (
                      <Text style={styles.translationText}>{sentence.translation}</Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.listenOnlyContent}>
                <Icon name="ear-outline" size={64} color={colors.retroCyan} />
                <Text style={styles.listenOnlyTitle}>Nghe tập trung</Text>
                <Text style={styles.listenOnlyDesc}>
                  Nghe toàn bộ audio mà không xem transcript.{'\n'}Tập trung hiểu nội dung chính.
                </Text>
              </View>
            )}

            {/* Play/Pause + Next Step */}
            <View style={styles.listenBottomBar}>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: colors.retroCyan, flex: 1 }]}
                onPress={() => {
                  if (isPlaying) {
                    playerRef.current?.pause();
                    setIsPlaying(false);
                  } else {
                    setIsPlaying(true);
                  }
                }}
              >
                <Icon name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
                <Text style={styles.playButtonText}>{isPlaying ? 'Tạm dừng' : 'Phát audio'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.nextStepButton, { flex: 1 }]} onPress={handleNextStep}>
                <Text style={styles.nextStepText}>Shadowing</Text>
                <Icon name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentStep === 'shadowing' && currentSentence && (
          <View style={styles.shadowingContent}>
            {/* Sentence counter */}
            <Text style={styles.sentenceCounter}>
              Câu {currentSentenceIndex + 1} / {sentences.length}
            </Text>

            {/* Current sentence */}
            <View style={styles.shadowingSentenceCard}>
              <Text style={styles.shadowingSentenceText}>{currentSentence.text}</Text>
              {currentSentence.translation ? (
                <Text style={styles.shadowingTranslation}>{currentSentence.translation}</Text>
              ) : null}
            </View>

            {/* Repeat counter */}
            <View style={styles.repeatCounter}>
              <Text style={styles.repeatCountText}>
                {shadowingCounts[currentSentenceIndex] || 0} / {SHADOWING_TARGET}
              </Text>
              <Text style={styles.repeatLabel}>lần lặp lại</Text>
            </View>

            {/* Controls */}
            <View style={styles.shadowingControls}>
              <TouchableOpacity
                style={styles.shadowingButton}
                onPress={handlePlaySentence}
              >
                <Icon name="play" size={24} color="#fff" />
                <Text style={styles.shadowingButtonText}>Nghe</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shadowingButton, { backgroundColor: colors.retroPurple }]}
                onPress={() => {
                  handlePlaySentence();
                  handleShadowingRepeat();
                }}
              >
                <Icon name="mic" size={24} color="#fff" />
                <Text style={styles.shadowingButtonText}>Nói theo</Text>
              </TouchableOpacity>
            </View>

            {/* Navigation */}
            <View style={styles.sentenceNav}>
              <TouchableOpacity
                style={[styles.navButton, currentSentenceIndex === 0 && styles.navButtonDisabled]}
                disabled={currentSentenceIndex === 0}
                onPress={() => setCurrentSentenceIndex(prev => Math.max(0, prev - 1))}
              >
                <Icon name="chevron-back" size={20} color={currentSentenceIndex === 0 ? colors.textMuted : colors.textPrimary} />
                <Text style={[styles.navButtonText, currentSentenceIndex === 0 && styles.navButtonTextDisabled]}>Trước</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, currentSentenceIndex >= sentences.length - 1 && styles.navButtonDisabled]}
                disabled={currentSentenceIndex >= sentences.length - 1}
                onPress={() => setCurrentSentenceIndex(prev => Math.min(sentences.length - 1, prev + 1))}
              >
                <Text style={[styles.navButtonText, currentSentenceIndex >= sentences.length - 1 && styles.navButtonTextDisabled]}>Tiếp</Text>
                <Icon name="chevron-forward" size={20} color={currentSentenceIndex >= sentences.length - 1 ? colors.textMuted : colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Overall progress */}
            <View style={styles.overallProgress}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${totalShadowingTarget > 0 ? (totalShadowingDone / totalShadowingTarget) * 100 : 0}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                Tổng: {totalShadowingDone} / {totalShadowingTarget} lần
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.retroCream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.retroBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  stepProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.textMuted,
  },
  stepDotActive: {
    backgroundColor: colors.retroPurple,
    width: 24,
    borderRadius: 5,
  },
  stepDotCompleted: {
    backgroundColor: colors.success,
  },
  playerContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  // Listen step
  listenContent: {
    flex: 1,
  },
  toggleTranscriptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.retroBorder,
  },
  toggleTranscriptText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listenBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  listenOnlyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  listenOnlyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  listenOnlyDesc: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: colors.retroBorder,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  nextStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.retroPurple,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: colors.retroBorder,
  },
  nextStepText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  transcriptScroll: {
    flex: 1,
    marginBottom: spacing.sm,
  },
  sentenceRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    marginBottom: 4,
  },
  sentenceRowActive: {
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: colors.retroCyan,
  },
  sentenceText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 24,
  },
  sentenceTextActive: {
    fontWeight: '700',
    color: colors.retroDark,
  },
  translationText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  // Step 3: Shadowing
  shadowingContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  sentenceCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  shadowingSentenceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.retroBorder,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.md,
  },
  shadowingSentenceText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 30,
    textAlign: 'center',
  },
  shadowingTranslation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  repeatCounter: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  repeatCountText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.retroPurple,
  },
  repeatLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  shadowingControls: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  shadowingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.retroCyan,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: colors.retroBorder,
  },
  shadowingButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  sentenceNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  navButtonTextDisabled: {
    color: colors.textMuted,
  },
  overallProgress: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.retroPurple,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default ListeningFlowScreen;
