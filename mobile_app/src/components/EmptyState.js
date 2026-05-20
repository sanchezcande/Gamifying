import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme/theme';

export default function EmptyState({ icon = '📭', message, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.text}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.button} onPress={onAction}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 16 },
  icon: { fontSize: 22, marginBottom: 6 },
  text: { color: colors.textSecondary, marginBottom: 8 },
  button: { backgroundColor: colors.primary, borderRadius: radius.button, paddingHorizontal: 12, paddingVertical: 8 },
  btnText: { color: colors.primaryOnDark, fontWeight: '700' }
});
