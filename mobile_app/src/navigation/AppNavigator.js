import React, { useMemo } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/theme';
import { useAuth } from '../providers/AuthProvider';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AvatarCreationScreen from '../screens/AvatarCreationScreen';
import MainTabs from './MainTabs';
import SessionChatScreen from '../screens/SessionChatScreen';
import LoadingScreen from '../components/LoadingScreen';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary
  }
};

export default function AppNavigator() {
  const { loading, isAuthenticated, user } = useAuth();

  const needsAvatar = useMemo(() => isAuthenticated && user && !user.avatarGender, [isAuthenticated, user]);

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : needsAvatar ? (
          <Stack.Screen name="AvatarCreation" component={AvatarCreationScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="SessionChat" component={SessionChatScreen} />
            <Stack.Screen name="AvatarCreation" component={AvatarCreationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
