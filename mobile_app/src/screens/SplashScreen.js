import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../providers/AuthProvider';
import { colors } from '../theme/theme';

// Floating particle behind the logo
function FloatingParticle({ delay, x, size, color, duration }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [20, -30] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.6, 0.2] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: '40%',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
}

export default function SplashScreen({ navigation }) {
  const { isAuthenticated, user } = useAuth();
  const scale    = useRef(new Animated.Value(0.6)).current;
  const opacity  = useRef(new Animated.Value(0)).current;
  const lineScale = useRef(new Animated.Value(0)).current;
  const tagFade  = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Entry animation sequence
    Animated.stagger(100, [
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(lineScale, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(tagFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Pulsing glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.8, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.3, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    const timer = setTimeout(() => {
      if (!isAuthenticated)          navigation.replace('Onboarding');
      else if (!user?.avatarGender)  navigation.replace('AvatarCreation');
      else                           navigation.replace('MainTabs');
    }, 2400);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigation, user]);

  return (
    <LinearGradient colors={['#0A0A0A', '#140003', '#0A0A0A']} style={styles.container}>
      {/* Background particles */}
      <FloatingParticle delay={0}    x="20%"  size={6}  color={colors.primary} duration={1600} />
      <FloatingParticle delay={300}  x="75%"  size={4}  color="#D4AF37"        duration={1400} />
      <FloatingParticle delay={600}  x="45%"  size={5}  color="#3B82F6"        duration={1800} />
      <FloatingParticle delay={200}  x="60%"  size={3}  color="#22C55E"        duration={1500} />
      <FloatingParticle delay={400}  x="30%"  size={4}  color="#FF6B35"        duration={1700} />

      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
        {/* Logo with glow */}
        <View style={styles.logoWrap}>
          <Animated.View style={[styles.logoGlow, { opacity: glowPulse }]} />
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>G</Text>
          </View>
        </View>

        <Text style={styles.brand}>GAMIFYING</Text>
        <Animated.View style={[styles.line, { transform: [{ scaleX: lineScale }] }]} />
        <Animated.Text style={[styles.tagline, { opacity: tagFade }]}>
          Turn Your Gym Into a Game
        </Animated.Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  logoGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.primary,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowRadius: 30,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
  },
  logoLetter: { color: '#fff', fontSize: 44, fontWeight: '900' },
  brand:      { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 6 },
  line:       { height: 3, width: 100, backgroundColor: colors.primary, borderRadius: 99, marginVertical: 14 },
  tagline:    { color: '#555', fontSize: 14, letterSpacing: 0.5 },
});
