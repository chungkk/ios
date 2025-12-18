// Custom hook for voice recording and playback
// Uses @react-native-community/audio-toolkit for recording

import { useState, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Recorder, Player } from '@react-native-community/audio-toolkit';
import { whisperService, ComparisonResult } from '../services/whisper.service';

export interface RecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  recordedUri: string | null;
  comparisonResult: ComparisonResult | null;
}

export interface UseVoiceRecordingOptions {
  onRecordingComplete?: (result: ComparisonResult) => void;
  onError?: (error: string) => void;
}

export const useVoiceRecording = (options?: UseVoiceRecordingOptions) => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isProcessing: false,
    isPlaying: false,
    recordedUri: null,
    comparisonResult: null,
  });

  const recorderRef = useRef<Recorder | null>(null);
  const playerRef = useRef<Player | null>(null);

  /**
   * Request microphone permission (Android only)
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record audio.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('[useVoiceRecording] Permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  }, []);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    try {
      console.log('[useVoiceRecording] Starting recording...');
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        console.error('[useVoiceRecording] Permission denied');
        options?.onError?.('Microphone permission denied');
        return;
      }

      console.log('[useVoiceRecording] Permission granted');

      // Clean up previous recorder
      if (recorderRef.current) {
        console.log('[useVoiceRecording] Cleaning up previous recorder');
        recorderRef.current.destroy();
      }

      const filename = `voice_recording_${Date.now()}.m4a`;
      console.log('[useVoiceRecording] Creating recorder with filename:', filename);
      
      const recorder = new Recorder(filename, {
        quality: 'max',
        format: 'm4a',
      });

      recorderRef.current = recorder;

      recorder.prepare((err) => {
        if (err) {
          console.error('[useVoiceRecording] Prepare error:', err);
          options?.onError?.('Failed to prepare recorder: ' + JSON.stringify(err));
          return;
        }

        console.log('[useVoiceRecording] Recorder prepared successfully');

        recorder.record((recordErr) => {
          if (recordErr) {
            console.error('[useVoiceRecording] Record error:', recordErr);
            options?.onError?.('Failed to start recording: ' + JSON.stringify(recordErr));
            return;
          }

          console.log('[useVoiceRecording] Recording started successfully');
          setRecordingState(prev => ({
            ...prev,
            isRecording: true,
            recordedUri: null,
            comparisonResult: null,
          }));
        });
      });
    } catch (error) {
      console.error('[useVoiceRecording] Start recording error:', error);
      options?.onError?.('Failed to start recording: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, [requestPermission, options]);

  /**
   * Stop recording and process audio
   */
  const stopRecording = useCallback(async (originalText: string) => {
    try {
      console.log('[useVoiceRecording] Stopping recording...');
      if (!recorderRef.current) {
        console.error('[useVoiceRecording] No recorder reference');
        return;
      }

      recorderRef.current.stop((err) => {
        if (err) {
          console.error('[useVoiceRecording] Stop error:', err);
          options?.onError?.('Failed to stop recording: ' + JSON.stringify(err));
          return;
        }

        const recordedUri = recorderRef.current?.fsPath || null;
        console.log('[useVoiceRecording] Recording stopped successfully');
        console.log('[useVoiceRecording] File path:', recordedUri);

        setRecordingState(prev => ({
          ...prev,
          isRecording: false,
          isProcessing: true,
          recordedUri,
        }));

        // Process transcription
        if (recordedUri) {
          console.log('[useVoiceRecording] Processing recording...');
          processRecording(recordedUri, originalText);
        } else {
          console.error('[useVoiceRecording] No recorded URI');
        }
      });
    } catch (error) {
      console.error('[useVoiceRecording] Stop recording error:', error);
      options?.onError?.('Failed to stop recording: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setRecordingState(prev => ({ ...prev, isRecording: false }));
    }
  }, [options]);

  /**
   * Process recording with Whisper API
   */
  const processRecording = useCallback(async (audioUri: string, originalText: string) => {
    try {
      // Transcribe audio
      const result = await whisperService.transcribe(audioUri, 'de');

      if (!result.success || !result.text) {
        Alert.alert('Error', result.message || 'Failed to transcribe audio');
        setRecordingState(prev => ({ ...prev, isProcessing: false }));
        return;
      }

      // Validate transcription
      if (!whisperService.isValidTranscription(result.text)) {
        Alert.alert('Error', 'Could not recognize speech. Please try again with clearer audio.');
        setRecordingState(prev => ({ ...prev, isProcessing: false }));
        return;
      }

      // Compare with original text
      const comparison = whisperService.compareTexts(result.text, originalText);

      setRecordingState(prev => ({
        ...prev,
        isProcessing: false,
        comparisonResult: comparison,
      }));

      options?.onRecordingComplete?.(comparison);

      // Show result
      Alert.alert(
        comparison.isCorrect ? 'Excellent! 🎉' : 'Good Try!',
        `Similarity: ${comparison.similarity}%\n\nYou said: "${comparison.transcribed}"\nCorrect: "${comparison.original}"`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[useVoiceRecording] Process error:', error);
      Alert.alert('Error', 'Failed to process recording');
      setRecordingState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [options]);

  /**
   * Play recorded audio
   */
  const playRecording = useCallback(() => {
    try {
      if (!recordingState.recordedUri) {
        return;
      }

      // Stop if already playing
      if (playerRef.current && recordingState.isPlaying) {
        playerRef.current.stop();
        playerRef.current.destroy();
        playerRef.current = null;
        setRecordingState(prev => ({ ...prev, isPlaying: false }));
        return;
      }

      // Clean up previous player
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      const player = new Player(recordingState.recordedUri);
      playerRef.current = player;

      player.play((err) => {
        if (err) {
          console.error('[useVoiceRecording] Playback error:', err);
          options?.onError?.('Failed to play recording');
          return;
        }

        setRecordingState(prev => ({ ...prev, isPlaying: true }));
      });

      player.on('ended', () => {
        console.log('[useVoiceRecording] Playback ended');
        setRecordingState(prev => ({ ...prev, isPlaying: false }));
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
      });
    } catch (error) {
      console.error('[useVoiceRecording] Play error:', error);
      options?.onError?.('Failed to play recording');
    }
  }, [recordingState.recordedUri, recordingState.isPlaying, options]);

  /**
   * Clear recording state
   */
  const clearRecording = useCallback(() => {
    // Stop and clean up recorder
    if (recorderRef.current) {
      if (recordingState.isRecording) {
        recorderRef.current.stop();
      }
      recorderRef.current.destroy();
      recorderRef.current = null;
    }

    // Stop and clean up player
    if (playerRef.current) {
      if (recordingState.isPlaying) {
        playerRef.current.stop();
      }
      playerRef.current.destroy();
      playerRef.current = null;
    }

    setRecordingState({
      isRecording: false,
      isProcessing: false,
      isPlaying: false,
      recordedUri: null,
      comparisonResult: null,
    });
  }, [recordingState.isRecording, recordingState.isPlaying]);

  return {
    recordingState,
    startRecording,
    stopRecording,
    playRecording,
    clearRecording,
  };
};

export default useVoiceRecording;
