import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

const STAGE_TO_SPRITE = {
  1: require('../assets/avatars/avatar_1_rookie.png'),
  2: require('../assets/avatars/avatar_2_beginner.png'),
  3: require('../assets/avatars/avatar_3_intermediate.png'),
  4: require('../assets/avatars/avatar_4_advanced.png'),
  5: require('../assets/avatars/avatar_5_beast.png'),
};

const CLASS_TO_SPRITE = {
  ROOKIE:   require('../assets/avatars/avatar_1_rookie.png'),
  FIGHTER:  require('../assets/avatars/avatar_3_intermediate.png'),
  CHAMPION: require('../assets/avatars/avatar_4_advanced.png'),
  WARRIOR:  require('../assets/avatars/avatar_5_beast.png'),
};

export const CLASS_GLOW = {
  WARRIOR:  '#FF2200',
  CHAMPION: '#3B82F6',
  FIGHTER:  '#22C55E',
  ROOKIE:   '#888888',
};

export const CLASS_AURA = {
  WARRIOR:  '🔥',
  CHAMPION: '⚡',
  FIGHTER:  '💚',
  ROOKIE:   '💨',
};

export default function AvatarSprite({
  avatarClass = 'ROOKIE',
  bodyStage,
  size = 120,
  flip = false,
  idle = true,
  glowColor,
  style,
}) {
  const stageSprite = bodyStage ? STAGE_TO_SPRITE[Number(bodyStage)] : null;
  const sprite = stageSprite || CLASS_TO_SPRITE[avatarClass] || CLASS_TO_SPRITE.ROOKIE;
  const glow   = glowColor || CLASS_GLOW[avatarClass] || '#888';

  const floatY      = useRef(new Animated.Value(0)).current;
  const breathScale = useRef(new Animated.Value(1)).current;
  const glowPulse   = useRef(new Animated.Value(0.45)).current;
  const loopsRef    = useRef([]);

  useEffect(() => {
    loopsRef.current.forEach(l => l?.stop());
    loopsRef.current = [];

    if (idle) {
      // ── Idle: gentle float + breathing ──────────────────────────────────
      const floatLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(floatY, { toValue: -10, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(floatY, { toValue: 0,   duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      const breathLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(breathScale, { toValue: 1.04, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(breathScale, { toValue: 1,    duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, { toValue: 0.75, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          Animated.timing(glowPulse, { toValue: 0.35, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        ])
      );
      loopsRef.current = [floatLoop, breathLoop, glowLoop];
      floatLoop.start();
      breathLoop.start();
      glowLoop.start();
    } else {
      // ── Combat: rapid trembling to show power ───────────────────────────
      breathScale.setValue(1.06);
      const trembleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(floatY, { toValue: -4, duration: 75, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(floatY, { toValue:  4, duration: 75, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(floatY, { toValue: -2, duration: 60, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(floatY, { toValue:  0, duration: 60, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      const chargePulse = Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, { toValue: 1.0, duration: 200, useNativeDriver: false }),
          Animated.timing(glowPulse, { toValue: 0.5, duration: 200, useNativeDriver: false }),
        ])
      );
      loopsRef.current = [trembleLoop, chargePulse];
      trembleLoop.start();
      chargePulse.start();
    }

    return () => loopsRef.current.forEach(l => l?.stop());
  }, [idle]);

  return (
    <View style={[styles.container, { width: size, height: size * 1.3 }, style]}>
      {/* Pulsing glow shadow underneath */}
      <Animated.View style={[
        styles.glow,
        {
          width: size * 0.65,
          backgroundColor: glow,
          shadowColor: glow,
          opacity: glowPulse,
        },
      ]} />

      <Animated.Image
        source={sprite}
        style={{
          width: size,
          height: size * 1.3,
          transform: [
            { translateY: floatY },
            { scaleX: flip ? -1 : 1 },
            { scale: breathScale },
          ],
        }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  glow: {
    position: 'absolute',
    bottom: -2,
    height: 8,
    borderRadius: 999,
    shadowRadius: 16,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 0 },
  },
});
