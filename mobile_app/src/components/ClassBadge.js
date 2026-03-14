import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const classColors = {
  ROOKIE: '#666666',
  FIGHTER: '#1F8B4C',
  CHAMPION: '#1E5DB4',
  WARRIOR: '#CC0000'
};

export default function ClassBadge({ avatarClass }) {
  return (
    <View style={[styles.badge, { backgroundColor: classColors[avatarClass] || '#666666' }]}>
      <Text style={styles.label}>{avatarClass || 'ROOKIE'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10
  },
  label: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11
  }
});
