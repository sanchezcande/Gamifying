import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
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
  const [loading, setLoading] = useState(!!profilePhoto);

  useEffect(() => {
    setFailed(false);
    setLoading(!!profilePhoto);
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
        <>
          <Image
            source={{ uri: profilePhoto }}
            style={{
              width: dimension * 1.6,
              height: dimension * 2.6,
              borderRadius: 0,
              marginTop: dimension * 1.6,
            }}
            resizeMode="cover"
            onLoad={() => setLoading(false)}
            onError={() => { setFailed(true); setLoading(false); }}
          />
          {loading && (
            <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
              <ActivityIndicator size={dimension > 60 ? 'large' : 'small'} color={colors.primary} />
            </View>
          )}
        </>
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
  },
  loadingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    borderRadius: 999,
  }
});
