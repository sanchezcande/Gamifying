import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../providers/AuthProvider';
import { colors, fonts } from '../theme/theme';

export default function SplashScreen({ navigation }) {
  const { isAuthenticated, user } = useAuth();
  const scale    = useRef(new Animated.Value(0.7)).current;
  const opacity  = useRef(new Animated.Value(0)).current;
  const lineScale = useRef(new Animated.Value(0)).current;
  const tagFade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(lineScale, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(tagFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      if (!isAuthenticated)          navigation.replace('Onboarding');
      else if (!user?.avatarGender)  navigation.replace('AvatarCreation');
      else                           navigation.replace('MainTabs');
    }, 2400);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigation, user]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>G</Text>
        </View>

        <Text style={styles.brand}>GAMIFYING</Text>
        <Animated.View style={[styles.line, { transform: [{ scaleX: lineScale }] }]} />
        <Animated.Text style={[styles.tagline, { opacity: tagFade }]}>
          THE REASON THEY DON'T QUIT.
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoLetter: { color: colors.primaryOnDark, fontSize: 48, fontFamily: fonts.heading || undefined, fontWeight: '900' },
  brand:      { color: colors.textPrimary, fontSize: 36, fontFamily: fonts.heading || undefined, fontWeight: '900', letterSpacing: 6 },
  line:       { height: 2, width: 100, backgroundColor: colors.primary, marginVertical: 14 },
  tagline:    { color: colors.textSecondary, fontSize: 12, letterSpacing: 2, fontWeight: '700', textTransform: 'uppercase' },
});
