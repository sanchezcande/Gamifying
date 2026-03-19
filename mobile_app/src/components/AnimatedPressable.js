import React, { useCallback, useRef } from 'react';
import { Animated, Platform, Pressable } from 'react-native';

let Haptics;
try { Haptics = require('expo-haptics'); } catch {}

export default function AnimatedPressable({
  children,
  style,
  onPress,
  haptic = 'light',
  scaleDown = 0.95,
  disabled,
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: scaleDown,
      useNativeDriver: true,
      friction: 8,
      tension: 300,
    }).start();
  }, [scaleDown]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 200,
    }).start();
  }, []);

  const handlePress = useCallback(() => {
    if (disabled) return;
    if (Haptics && haptic && Platform.OS !== 'web') {
      const styles = {
        light: Haptics.ImpactFeedbackStyle?.Light,
        medium: Haptics.ImpactFeedbackStyle?.Medium,
        heavy: Haptics.ImpactFeedbackStyle?.Heavy,
      };
      if (styles[haptic]) Haptics.impactAsync(styles[haptic]);
    }
    onPress?.();
  }, [onPress, haptic, disabled]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
