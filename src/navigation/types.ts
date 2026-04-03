// Navigation types for React Navigation
// Define route params and navigator types

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// Root Stack Navigator (Auth + Main)
export type RootStackParamList = {
  Auth: { screen?: keyof AuthStackParamList };
  Main: undefined;
};

// Auth Stack Navigator
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Main Tab Navigator (Bottom Tabs)
export type MainTabParamList = {
  Read: undefined;
  Write: undefined;
  Settings: undefined;
};

// ListenSpeak Stack (kept for screen type compatibility)
export type ListenSpeakStackParamList = {
  ListenSpeakHome: undefined;
  Category: { categorySlug: string; categoryName: string };
  ListeningFlow: { lessonId: string };
  Statistics: undefined;
};

export type ListenSpeakStackScreenProps<T extends keyof ListenSpeakStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ListenSpeakStackParamList, T>,
    MainTabScreenProps<keyof MainTabParamList>
  >;

// Read Stack Navigator (nested in Read tab)
export type ReadStackParamList = {
  ReadingList: undefined;
  ReadingDetail: { nachrichtId: string };
};

// Write Stack Navigator (nested in Write tab)
export type WriteStackParamList = {
  WriteHome: undefined;
  WriteCategory: { categorySlug: string; categoryName: string };
  Dictation: { lessonId: string };
};

// Legacy Home Stack (kept for backward compatibility during migration)
export type HomeStackParamList = {
  HomeScreen: undefined;
  Category: { categorySlug: string; categoryName: string };
  Lesson: { lessonId: string; initialSentenceIndex?: number };
  Dictation: { lessonId: string };
  Statistics: undefined;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AuthStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type ReadStackScreenProps<T extends keyof ReadStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ReadStackParamList, T>,
    MainTabScreenProps<keyof MainTabParamList>
  >;

export type WriteStackScreenProps<T extends keyof WriteStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<WriteStackParamList, T>,
    MainTabScreenProps<keyof MainTabParamList>
  >;

// Legacy - kept for backward compatibility
export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, T>,
    MainTabScreenProps<keyof MainTabParamList>
  >;

// Navigation prop types for use in components
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
