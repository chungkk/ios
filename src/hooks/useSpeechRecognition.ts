import { useState, useEffect, useCallback } from 'react';
// import Voice from '@react-native-voice/voice'; // Will be installed later

/**
 * Speech Recognition Hook
 * Wrapper for react-native-voice library
 * Note: Requires @react-native-voice/voice package
 */

interface UseSpeechRecognitionProps {
  language?: string; // e.g., 'de-DE' for German
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
}

export const useSpeechRecognition = ({
  language = 'de-DE',
  onResult,
  onError,
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  /**
   * Stop listening for speech
   */
  const stopListening = useCallback(async () => {
    try {
      // TODO: Uncomment when @react-native-voice/voice is installed
      // await Voice.stop();
      
      console.log('Mock: Stopping voice recognition');
      setIsListening(false);
    } catch (err) {
      console.error('Failed to stop listening:', err);
      setIsListening(false);
    }
  }, []);

  // Initialize Voice
  useEffect(() => {
    checkAvailability();

    // Cleanup on unmount
    return () => {
      stopListening();
    };
  }, [stopListening]);

  /**
   * Check if speech recognition is available
   */
  const checkAvailability = async () => {
    try {
      // TODO: Uncomment when @react-native-voice/voice is installed
      // const available = await Voice.isAvailable();
      // setIsAvailable(!!available);
      
      // Temporary mock for development
      console.warn('Voice recognition not yet integrated - mock mode');
      setIsAvailable(true);
    } catch (err) {
      console.error('Voice recognition check failed:', err);
      setIsAvailable(false);
    }
  };

  /**
   * Start listening for speech
   */
  const startListening = useCallback(async () => {
    if (!isAvailable) {
      const errorMsg = 'Speech recognition is not available';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    try {
      setIsListening(true);
      setError(null);
      setRecognizedText('');

      // TODO: Uncomment when @react-native-voice/voice is installed
      // await Voice.start(language);

      // Temporary mock for development
      console.log('Mock: Starting voice recognition in language:', language);
      
      // Simulate recognition after 2 seconds
      setTimeout(() => {
        const mockText = 'Ich habe Angst vor Spinnen'; // Example German sentence
        setRecognizedText(mockText);
        if (onResult) onResult(mockText);
        setIsListening(false);
      }, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start listening';
      setError(errorMsg);
      setIsListening(false);
      if (onError) onError(errorMsg);
    }
  }, [isAvailable, language, onResult, onError]);

  /**
   * Cancel listening and clear results
   */
  const cancelListening = useCallback(async () => {
    try {
      // TODO: Uncomment when @react-native-voice/voice is installed
      // await Voice.cancel();
      
      console.log('Mock: Canceling voice recognition');
      setIsListening(false);
      setRecognizedText('');
      setError(null);
    } catch (err) {
      console.error('Failed to cancel listening:', err);
    }
  }, []);

  /**
   * Clear recognition results
   */
  const clearResults = useCallback(() => {
    setRecognizedText('');
    setError(null);
  }, []);

  return {
    // State
    isListening,
    recognizedText,
    error,
    isAvailable,

    // Actions
    startListening,
    stopListening,
    cancelListening,
    clearResults,
  };
};

export default useSpeechRecognition;
