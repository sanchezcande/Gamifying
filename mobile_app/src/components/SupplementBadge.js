import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/theme';

export default function SupplementBadge({ label }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>💊 {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginRight: 8
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 12 }
});
