import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme/theme';

export default function StatCard({ icon, value, label }) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  icon: { fontSize: 16, marginBottom: 6 },
  value: { color: colors.primary, fontWeight: '800', fontSize: 22 },
  label: { color: colors.textSecondary, fontSize: 12, textTransform: 'uppercase' }
});
