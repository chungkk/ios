import React from 'react';
import { Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import type {
  MainTabParamList,
  ReadStackParamList,
  WriteStackParamList,
} from './types';
import { colors } from '../styles/theme';
import CategoryScreen from '../screens/CategoryScreen';
import ReadingListScreen from '../screens/ReadingListScreen';
import ReadingDetailScreen from '../screens/ReadingDetailScreen';
import DictationScreen from '../screens/DictationScreen';
import WriteHomeScreen from '../screens/WriteHomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

const TabIcon = ({ iconName, focused }: { iconName: string; focused: boolean }) => {
  const activeIcon = iconName;
  const inactiveIcon = `${iconName}-outline`;

  return (
    <Icon
      name={focused ? activeIcon : inactiveIcon}
      size={isTablet ? 32 : 24}
      color={focused ? colors.retroPurple : colors.textSecondary}
    />
  );
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const ReadStack = createNativeStackNavigator<ReadStackParamList>();
const WriteStack = createNativeStackNavigator<WriteStackParamList>();

// Read Stack
const ReadStackNavigator = () => {
  return (
    <ReadStack.Navigator screenOptions={{ headerShown: false }}>
      <ReadStack.Screen name="ReadingList" component={ReadingListScreen} />
      <ReadStack.Screen name="ReadingDetail" component={ReadingDetailScreen} />
    </ReadStack.Navigator>
  );
};

// Write Stack
const WriteStackNavigator = () => {
  return (
    <WriteStack.Navigator screenOptions={{ headerShown: false }}>
      <WriteStack.Screen name="WriteHome" component={WriteHomeScreen} />
      <WriteStack.Screen name="WriteCategory" component={CategoryScreen} />
      <WriteStack.Screen name="Dictation" component={DictationScreen} />
    </WriteStack.Navigator>
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
          height: isTablet ? 95 : 75,
          paddingBottom: isTablet ? 20 : 14,
          paddingTop: isTablet ? 14 : 10,
          shadowColor: '#1a1a2e',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 0,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.retroPurple,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: isTablet ? 15 : 10,
          fontWeight: '700',
          marginTop: isTablet ? 6 : 4,
        },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tab.Screen
        name="Read"
        component={ReadStackNavigator}
        options={{
          tabBarLabel: 'Đọc',
          tabBarIcon: ({ focused }) => <TabIcon iconName="book" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Write"
        component={WriteStackNavigator}
        options={{
          tabBarLabel: 'Chính tả',
          tabBarIcon: ({ focused }) => <TabIcon iconName="headset" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Cài đặt',
          tabBarIcon: ({ focused }) => <TabIcon iconName="settings" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
