import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/theme';

export default function XPBar({ current = 0, next = 1, showLabel = true, height = 20 }) {
  const ratio = Math.max(0, Math.min(1, current / Math.max(1, next)));
  const animScale = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animScale, {
      toValue: ratio,
      duration: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    if (ratio > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.8, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.2, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [ratio]);

  return (
    <View style={[styles.wrapper, { height }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            transform: [{ scaleX: animScale }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowOpacity,
              shadowColor: colors.primary,
              shadowRadius: 8,
              shadowOpacity: 1,
            },
          ]}
        />
      </Animated.View>
      {showLabel && (
        <Text style={[styles.label, { lineHeight: height }]}>
          {Math.round(ratio * 100)}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
    overflow: 'hidden',
    transformOrigin: 'left center',
  },
  glow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  label: {
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 11,
  },
});
