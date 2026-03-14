import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../providers/AuthProvider';
import { colors } from '../theme/theme';

export default function SplashScreen({ navigation }) {
  const { isAuthenticated, user } = useAuth();
  const scale   = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const lineW   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(lineW,   { toValue: 80, duration: 600, delay: 200, useNativeDriver: false }),
    ]).start();

    const timer = setTimeout(() => {
      if (!isAuthenticated)     navigation.replace('Login');
      else if (!user?.avatarGender) navigation.replace('AvatarCreation');
      else                      navigation.replace('MainTabs');
    }, 2200);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigation, user]);

  return (
    <LinearGradient colors={['#0A0A0A', '#140003', '#0A0A0A']} style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>G</Text>
        </View>
        <Text style={styles.brand}>GAMIFYING</Text>
        <Animated.View style={[styles.line, { width: lineW }]} />
        <Text style={styles.tagline}>Turn Your Gym Into a Game</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoBox: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.primary, shadowRadius: 30, shadowOpacity: 0.6, shadowOffset: { width: 0, height: 0 },
  },
  logoLetter: { color: '#fff', fontSize: 44, fontWeight: '900' },
  brand:      { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 6 },
  line:       { height: 3, backgroundColor: colors.primary, borderRadius: 99, marginVertical: 14 },
  tagline:    { color: '#444', fontSize: 14, letterSpacing: 0.5 },
});
