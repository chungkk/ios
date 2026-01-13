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
  Home: undefined;
  Vocabulary: undefined;
  DailyPhrase: undefined;
  Settings: undefined;
};

// Home Stack Navigator (nested in Home tab)
export type HomeStackParamList = {
  HomeScreen: undefined;
  Category: { categorySlug: string; categoryName: string };
  Lesson: { lessonId: string };
  Dictation: { lessonId: string };
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
