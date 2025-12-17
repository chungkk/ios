// LessonScreen - Video player with synchronized transcript
// Migrated from ppgeil/pages/[lessonId].js and ppgeil/pages/dictation/[lessonId].js

import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Alert, Text } from 'react-native';
import { useLessonData } from '../hooks/useLessonData';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useTranscriptSync } from '../hooks/useTranscriptSync';
import VideoPlayer, { VideoPlayerRef } from '../components/player/VideoPlayer';
import TranscriptView from '../components/player/TranscriptView';
import PlaybackControls from '../components/player/PlaybackControls';
import { Loading } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { progressService } from '../services/progress.service';
import { extractVideoId } from '../utils/youtube';
import { colors, spacing, borderRadius } from '../styles/theme';
import type { HomeStackScreenProps } from '../navigation/types';

type LessonScreenProps = HomeStackScreenProps<'Lesson'>;

export const LessonScreen: React.FC<LessonScreenProps> = ({ route, navigation }) => {
  const { lessonId } = route.params;
  
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

  const {
    isPlaying,
    playbackSpeed,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    togglePlayPause,
  } = useVideoPlayer();

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
      setIsPlaying(true);
    } else if (state === 'paused') {
      setIsPlaying(false);
    } else if (state === 'ended') {
      setIsPlaying(false);
      handleLessonComplete();
    }
  }, [setIsPlaying, handleLessonComplete]);

  const handleError = useCallback((errorMsg: string) => {
    console.error('[LessonScreen] Video player error:', errorMsg);
    Alert.alert('Video Error', 'Failed to load video. Please try again.');
  }, []);

  const handleSentencePress = useCallback((index: number) => {
    const sentence = lesson?.transcript[index];
    if (sentence && videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(sentence.startTime);
      setIsPlaying(true);
    }
  }, [lesson, setIsPlaying]);

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{lesson.title}</Text>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsIcon}>💎</Text>
          <Text style={styles.pointsText}>10190</Text>
        </View>
      </View>

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

      <View style={styles.transcriptContainer}>
        <TranscriptView
          transcript={transcript}
          activeSentenceIndex={activeSentenceIndex}
          onSentencePress={handleSentencePress}
        />
      </View>

      <PlaybackControls
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
      />
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
    backgroundColor: colors.bgPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  pointsIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  videoContainer: {
    height: 250,
    backgroundColor: colors.bgPrimary,
  },
  transcriptContainer: {
    flex: 1,
  },
});

export default LessonScreen;
