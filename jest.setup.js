/* eslint-env jest */
// Jest setup file - mocks for testing

// Mock AsyncStorage
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve({ username: 'test', password: 'test' })),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock TTS
jest.mock('react-native-tts', () => ({
  setDefaultLanguage: jest.fn(),
  speak: jest.fn(),
  stop: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(),
}));

// Mock YouTube Bridge
jest.mock('react-native-youtube-bridge', () => ({
  YoutubeView: 'YoutubeView',
  useYouTubePlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
  })),
  useYouTubeEvent: jest.fn(),
  PlayerState: {
    UNSTARTED: 'unstarted',
    ENDED: 'ended',
    PLAYING: 'playing',
    PAUSED: 'paused',
    BUFFERING: 'buffering',
  },
}));

// Silence console warnings in tests (optional)
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
