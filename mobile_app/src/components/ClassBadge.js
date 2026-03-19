import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const classConfig = {
  ROOKIE:   { color: '#888888', bg: '#1a1a1a', border: '#88888833', icon: 'cloudy-outline' },
  FIGHTER:  { color: '#22C55E', bg: '#0D2E1A', border: '#22C55E33', icon: 'shield-half' },
  CHAMPION: { color: '#3B82F6', bg: '#0D1A2E', border: '#3B82F633', icon: 'flash' },
  WARRIOR:  { color: '#CC0000', bg: '#2b1111', border: '#CC000033', icon: 'flame' },
};

export default function ClassBadge({ avatarClass, showIcon = false }) {
  const cfg = classConfig[avatarClass] || classConfig.ROOKIE;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (avatarClass === 'WARRIOR') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.06, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [avatarClass]);

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          borderWidth: 1,
          transform: [{ scale: pulse }],
          shadowColor: cfg.color,
          shadowRadius: 6,
          shadowOpacity: 0.4,
          shadowOffset: { width: 0, height: 0 },
        },
      ]}
    >
      {showIcon && <Ionicons name={cfg.icon} size={12} color={cfg.color} />}
      <Text style={[styles.label, { color: cfg.color }]}>
        {avatarClass || 'ROOKIE'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  label: {
    fontWeight: '800',
    fontSize: 11,
  },
});
