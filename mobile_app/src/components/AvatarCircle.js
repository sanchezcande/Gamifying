import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text } from 'react-native';
import { getInitials } from '../utils/avatar';
import { colors } from '../theme/theme';

const sizes = { small: 36, medium: 54, large: 110 };

const CLASS_BORDER = {
  WARRIOR:  colors.primary,
  CHAMPION: '#3B82F6',
  FIGHTER:  '#22C55E',
  ROOKIE:   '#555555'
};

function dicebearUrl(seed) {
  return `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(seed)}&size=256&backgroundColor=111111`;
}

function getSupplementGlow(activeSupplements = []) {
  const cats = activeSupplements.map((s) => s.shopItem?.category || s.category);
  if (cats.includes('AURA'))       return '#FF6B00';
  if (cats.includes('PREWORKOUT')) return '#FFD700';
  if (cats.includes('CREATINE'))   return '#3B82F6';
  if (cats.includes('PROTEIN'))    return '#22C55E';
  return null;
}

export default function AvatarCircle({ name, avatarClass, bodyStage, size = 'medium', activeSupplements = [], profilePhoto, previewSeed }) {
  const dimension = typeof size === 'number' ? size : (sizes[size] || sizes.medium);
  const glowColor = getSupplementGlow(activeSupplements);
  const borderColor = glowColor || CLASS_BORDER[avatarClass] || '#444';
  const fallbackSeed = previewSeed || `${name || 'avatar'}-${avatarClass}-${bodyStage || 1}`;
  const primaryUri = profilePhoto;
  const fallbackUri = dicebearUrl(fallbackSeed);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [usingFallback, setUsingFallback] = useState(false);
  const [allFailed, setAllFailed] = useState(false);

  useEffect(() => {
    if (!glowColor) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.14, duration: 650, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 650, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glowColor]);

  useEffect(() => {
    setUsingFallback(false);
    setAllFailed(false);
  }, [primaryUri]);

  const handleError = () => {
    if (!usingFallback) {
      setUsingFallback(true);
    } else {
      setAllFailed(true);
    }
  };

  const sourceUri = !primaryUri || usingFallback ? fallbackUri : primaryUri;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          borderColor,
          borderWidth: glowColor ? 2.5 : 2,
          transform: [{ scale: pulseAnim }],
          shadowColor: glowColor || borderColor,
          shadowRadius: glowColor ? 14 : 6,
          shadowOpacity: glowColor ? 0.9 : 0.5,
          shadowOffset: { width: 0, height: 0 }
        }
      ]}
    >
      {allFailed ? (
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: dimension * 0.28 }}>
          {getInitials(name)}
        </Text>
      ) : (
        <Image
          source={{ uri: sourceUri }}
          style={{ width: dimension - 4, height: dimension - 4, borderRadius: (dimension - 4) / 2 }}
          onError={handleError}
        />
      )}
    </Animated.View>
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
