import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import type { MainTabParamList, HomeStackParamList } from './types';
import { colors } from '../styles/theme';
import HomeScreen from '../screens/HomeScreen';
import CategoryScreen from '../screens/CategoryScreen';
import LessonScreen from '../screens/LessonScreen';
import DictationScreen from '../screens/DictationScreen';
import DailyPhraseScreen from '../screens/DailyPhraseScreen';
import VocabularyScreen from '../screens/VocabularyScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Tab Bar Icons - Neo-Retro Style
const TabIcon = ({ iconName, focused }: { iconName: string; focused: boolean }) => (
  <Icon name={iconName} size={22} color={focused ? colors.retroPurple : colors.textMuted} />
);

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

// Home Stack Navigator (nested in Home tab)
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen name="Category" component={CategoryScreen} />
      <HomeStack.Screen name="Lesson" component={LessonScreen} />
      <HomeStack.Screen name="Dictation" component={DictationScreen} />
    </HomeStack.Navigator>
  );
};

export const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.retroCream,
          borderTopColor: colors.retroBorder,
          borderTopWidth: 3,
          height: 75,
          paddingBottom: 14,
          paddingTop: 10,
          shadowColor: '#1a1a2e',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 0,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.retroPurple,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Học tập',
          tabBarIcon: ({ focused }) => <TabIcon iconName="book" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Vocabulary"
        component={VocabularyScreen}
        options={{
          tabBarLabel: 'Vocabulary',
          tabBarIcon: ({ focused }) => <TabIcon iconName="book" focused={focused} />,
        }}
      />
      {/* Temporarily hidden
      <Tab.Screen
        name="DailyPhrase"
        component={DailyPhraseScreen}
        options={{
          tabBarLabel: 'Phrase',
          tabBarIcon: ({ focused }) => <TabIcon iconName="chatbubble-ellipses" focused={focused} />,
        }}
      />
      */}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon iconName="settings" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
