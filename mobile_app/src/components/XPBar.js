import React, { useMemo } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/theme';

export default function XPBar({ current = 0, next = 1 }) {
  const ratio = useMemo(() => Math.max(0, Math.min(1, current / Math.max(1, next))), [current, next]);
  const width = `${Math.round(ratio * 100)}%`;

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.fill, { width }]} />
      <Text style={styles.label}>{Math.round(ratio * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 20,
    backgroundColor: '#2f2f2f',
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center'
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    borderRadius: 999
  },
  label: {
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 11
  }
});
