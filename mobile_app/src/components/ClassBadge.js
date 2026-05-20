import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';

const classConfig = {
  ROOKIE:   { color: '#6B6560', bg: colors.cardLight, border: '#6B656044', icon: 'cloudy-outline' },
  FIGHTER:  { color: '#22C55E', bg: '#E8F5E9', border: '#22C55E33', icon: 'shield-half' },
  CHAMPION: { color: '#3B82F6', bg: '#E3F2FD', border: '#3B82F633', icon: 'flash' },
  WARRIOR:  { color: '#CC0000', bg: '#FBE9E7', border: '#CC000033', icon: 'flame' },
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
          borderWidth: 1.5,
          transform: [{ scale: pulse }],
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
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  label: {
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
