import React, { useMemo } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/theme';
import { useAuth } from '../providers/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import LanguageScreen from '../screens/LanguageScreen';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AvatarCreationScreen from '../screens/AvatarCreationScreen';
import QrScannerScreen from '../screens/QrScannerScreen';
import PurchaseQrScreen from '../screens/PurchaseQrScreen';
import StaffScanScreen from '../screens/StaffScanScreen';
import MainTabs from './MainTabs';
import SessionChatScreen from '../screens/SessionChatScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import FeedbackListScreen from '../screens/FeedbackListScreen';
import LoadingScreen from '../components/LoadingScreen';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary,
  }
};

export default function AppNavigator() {
  const { loading, isAuthenticated, user } = useAuth();
  const { lang, langReady } = useI18n();

  const needsAvatar = useMemo(() => isAuthenticated && user && !user.avatarGender, [isAuthenticated, user]);

  if (loading || !langReady) return <LoadingScreen />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!lang ? (
          <>
            <Stack.Screen name="Language" component={LanguageScreen} />
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : !isAuthenticated ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
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
            <Stack.Screen name="QrScanner" component={QrScannerScreen} options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="PurchaseQr" component={PurchaseQrScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="StaffScan" component={StaffScanScreen} options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="Feedback" component={FeedbackScreen} />
            <Stack.Screen name="FeedbackList" component={FeedbackListScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
