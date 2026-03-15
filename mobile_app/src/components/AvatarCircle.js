import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text } from 'react-native';
import { getInitials } from '../utils/avatar';
import { buildFacePrompt } from '../utils/faceLabels';
import { colors } from '../theme/theme';

const sizes = { small: 36, medium: 54, large: 82 };

const CLASS_BORDER = {
  WARRIOR:  colors.primary,
  CHAMPION: '#3B82F6',
  FIGHTER:  '#22C55E',
  ROOKIE:   '#555555'
};

// Prompt per class — generates a unique AI fighter portrait
const CLASS_PROMPTS = {
  WARRIOR:  'muscular male bodybuilder warrior fighter portrait, red fire aura, dramatic dark background, intense expression, fighting game character art style, close up face and shoulders, no text',
  CHAMPION: 'athletic male champion fighter portrait, blue electric aura, dark background, powerful expression, fighting game character art style, close up face and shoulders, no text',
  FIGHTER:  'strong male gym fighter portrait, green energy glow, dark background, determined expression, fighting game character art style, close up face and shoulders, no text',
  ROOKIE:   'young male rookie fighter portrait, grey tones, dark background, motivated expression, fighting game character art style, close up face and shoulders, no text'
};

// Stable numeric seed from name string
function nameSeed(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash % 99999;
}

function avatarUrl(name, avatarClass, faceOptions, imageVariant = 0) {
  const base = CLASS_PROMPTS[avatarClass] || CLASS_PROMPTS.ROOKIE;
  const faceDesc = faceOptions ? buildFacePrompt(faceOptions) : '';
  const fullPrompt = faceDesc ? `${faceDesc}, ${base}` : base;
  const prompt = encodeURIComponent(fullPrompt);
  const seed = (nameSeed(name) + Number(imageVariant || 0) * 97) % 99999;
  return `https://image.pollinations.ai/prompt/${prompt}?width=256&height=256&nologo=true&seed=${seed}&model=flux`;
}

function getSupplementGlow(activeSupplements = []) {
  const cats = activeSupplements.map((s) => s.shopItem?.category || s.category);
  if (cats.includes('AURA'))       return '#FF6B00';
  if (cats.includes('PREWORKOUT')) return '#FFD700';
  if (cats.includes('CREATINE'))   return '#3B82F6';
  if (cats.includes('PROTEIN'))    return '#22C55E';
  return null;
}

export default function AvatarCircle({ name, avatarClass, size = 'medium', activeSupplements = [], faceOptions, profilePhoto, imageVariant = 0 }) {
  const dimension = sizes[size] || sizes.medium;
  const glowColor = getSupplementGlow(activeSupplements);
  const borderColor = glowColor || CLASS_BORDER[avatarClass] || '#444';
  const sourceUri = profilePhoto || avatarUrl(name, avatarClass, faceOptions, imageVariant);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [imgError, setImgError] = useState(false);

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
    setImgError(false);
  }, [sourceUri]);

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
      {imgError ? (
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: dimension * 0.28 }}>
          {getInitials(name)}
        </Text>
      ) : (
        <Image
          source={{ uri: sourceUri }}
          style={{ width: dimension - 4, height: dimension - 4, borderRadius: (dimension - 4) / 2 }}
          onError={() => setImgError(true)}
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
