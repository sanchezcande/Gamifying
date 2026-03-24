import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/theme';

export default function LoadingScreen() {
  const pulse = useRef(new Animated.Value(0.9)).current;
  const dot1 = useRef(new Animated.Value(0.2)).current;
  const dot2 = useRef(new Animated.Value(0.2)).current;
  const dot3 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.9, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    const animDot = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.2, duration: 400, useNativeDriver: true }),
        ])
      );
    animDot(dot1, 0).start();
    animDot(dot2, 150).start();
    animDot(dot3, 300).start();
  }, []);

  return (
    <LinearGradient colors={['#0A0A0A', '#140003', '#0A0A0A']} style={styles.container}>
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: pulse }] }]}>
        <Text style={styles.brandText}>GAMIFYING</Text>
      </Animated.View>
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  brandText: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
    textShadowColor: colors.primary,
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
  },
  dotsRow: { flexDirection: 'row', gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#444' },
});
