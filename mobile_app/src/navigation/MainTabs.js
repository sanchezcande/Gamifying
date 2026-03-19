import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import BattleScreen from '../screens/BattleScreen';
import GymBuddyScreen from '../screens/GymBuddyScreen';
import ShopScreen from '../screens/ShopScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/theme';

const Tab = createBottomTabNavigator();

function TabIcon({ name, color, size, focused }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Ionicons name={name} size={size - 2} color={color} />
      {focused && <View style={[tabStyles.activeDot, { backgroundColor: color }]} />}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  iconWrapActive: {
    transform: [{ scale: 1.05 }],
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
});

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D0D0D',
          borderTopColor: '#1a1a1a',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 6,
          shadowColor: '#000',
          shadowRadius: 12,
          shadowOpacity: 0.5,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#444',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const nameMap = {
            Home: 'home',
            Leaderboard: 'trophy',
            Battle: 'flash',
            GymBuddy: 'people',
            Shop: 'bag',
            Profile: 'person-circle',
          };
          return <TabIcon name={nameMap[route.name]} color={color} size={size} focused={focused} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Battle" component={BattleScreen} />
      <Tab.Screen name="GymBuddy" component={GymBuddyScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
