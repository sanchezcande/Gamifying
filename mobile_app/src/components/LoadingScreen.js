import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/theme';

export default function LoadingScreen() {
  const pulse = useRef(new Animated.Value(0.95)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;
  const dot1 = useRef(new Animated.Value(0.2)).current;
  const dot2 = useRef(new Animated.Value(0.2)).current;
  const dot3 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    // Subtle scale pulse on the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.95, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Glow breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.7, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.2, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Cascading dots
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
        <Animated.View style={[styles.glow, { opacity: glowPulse }]} />
        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>G</Text>
        </View>
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
  glow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.primary,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowRadius: 24,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
  },
  logoLetter: { color: '#fff', fontSize: 34, fontWeight: '900' },
  dotsRow: { flexDirection: 'row', gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#444' },
});
