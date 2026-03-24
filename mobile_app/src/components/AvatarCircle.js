import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getInitials } from '../utils/avatar';
import { colors } from '../theme/theme';

const sizes = { small: 36, medium: 54, large: 110 };

const CLASS_BORDER = {
  WARRIOR:  colors.primary,
  CHAMPION: '#3B82F6',
  FIGHTER:  '#D4AF37',
  ROOKIE:   '#555555'
};

export default function AvatarCircle({ name, avatarClass, bodyStage, size = 'medium', profilePhoto }) {
  const dimension = typeof size === 'number' ? size : (sizes[size] || sizes.medium);
  const borderColor = CLASS_BORDER[avatarClass] || '#444';
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [profilePhoto]);

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          borderColor,
          borderWidth: 2,
          shadowColor: borderColor,
          shadowRadius: 6,
          shadowOpacity: 0.5,
          shadowOffset: { width: 0, height: 0 }
        }
      ]}
    >
      {!profilePhoto || failed ? (
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: dimension * 0.28 }}>
          {getInitials(name)}
        </Text>
      ) : (
        <Image
          source={{ uri: profilePhoto }}
          style={{
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
          }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    overflow: 'hidden'
  }
});
