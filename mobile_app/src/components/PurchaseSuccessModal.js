import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from './AnimatedPressable';
import { colors, fonts } from '../theme/theme';

let Haptics;
try { Haptics = require('expo-haptics'); } catch {}

const SUPPLEMENT_INFO = {
  PROTEIN: {
    emoji: '💪',
    title: 'PROTEÍNA ACTIVADA',
    color: '#22C55E',
    effects: [
      { icon: 'fitness', where: 'CHECK-IN', desc: 'Tu MÚSCULO sube 20% más cada entrenamiento', descDetail: 'Tu PODER también sube 30% más' },
      { icon: 'flash', where: 'BATALLA', desc: 'Desbloquea "PROTEIN SURGE"', descDetail: 'Golpe especial de fuerza que hace mucho más daño' },
    ],
  },
  CREATINE: {
    emoji: '⚡',
    title: 'CREATINA ACTIVADA',
    color: '#3B82F6',
    effects: [
      { icon: 'fitness', where: 'CHECK-IN', desc: 'Tu PODER sube 40% más cada entrenamiento', descDetail: 'Tu MÚSCULO también sube 15% más' },
      { icon: 'flash', where: 'BATALLA', desc: 'Desbloquea "CREATINE BLAST"', descDetail: 'Descarga de poder que arrasa al rival' },
    ],
  },
  PREWORKOUT: {
    emoji: '🚀',
    title: 'PRE-ENTRENO ACTIVADO',
    color: '#FF6B35',
    effects: [
      { icon: 'fitness', where: 'CHECK-IN', desc: 'Ganás el DOBLE de experiencia', descDetail: 'Subís de nivel mucho más rápido' },
      { icon: 'flash', where: 'BATALLA', desc: 'Desbloquea "RUSH"', descDetail: 'Siempre atacás primero con daño extra' },
    ],
  },
  AURA: {
    emoji: '🔥',
    title: 'AURA ACTIVADA',
    color: '#CC0000',
    effects: [
      { icon: 'fitness', where: 'CHECK-IN', desc: 'TODAS tus estadísticas suben 10% más', descDetail: 'Músculo, Poder y Resistencia' },
      { icon: 'flash', where: 'BATALLA', desc: 'Desbloquea "AURA BURST"', descDetail: 'Daño a todo + te recuperás vida' },
    ],
  },
  STREAK_SHIELD: {
    emoji: '🛡',
    title: 'ESCUDO DE RACHA ACTIVADO',
    color: '#22C55E',
    effects: [
      { icon: 'shield-checkmark', where: 'PROTECCIÓN', desc: 'Si un día no entrenás, tu racha NO se pierde', descDetail: 'Se activa automáticamente cuando faltás' },
      { icon: 'alert-circle', where: 'IMPORTANTE', desc: 'Se usa una sola vez y se gasta', descDetail: 'Comprá otro si querés seguir protegido' },
    ],
  },
};

export default function PurchaseSuccessModal({ visible, item, onClose }) {
  const info = SUPPLEMENT_INFO[item?.category];
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconGlow = useRef(new Animated.Value(0.3)).current;
  const effectsOpacity = useRef(new Animated.Value(0)).current;
  const effectsY = useRef(new Animated.Value(20)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      iconScale.setValue(0);
      iconGlow.setValue(0.3);
      effectsOpacity.setValue(0);
      effectsY.setValue(20);
      btnOpacity.setValue(0);
      return;
    }

    if (Haptics && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Card entrance
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    // Icon pop
    setTimeout(() => {
      Animated.spring(iconScale, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }).start();
    }, 200);

    // Icon glow pulse loop
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconGlow, { toValue: 0.8, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(iconGlow, { toValue: 0.3, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }, 400);

    // Effects cards slide in
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(effectsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(effectsY, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    }, 500);

    // Button fade in
    setTimeout(() => {
      Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, 800);
  }, [visible]);

  if (!visible || !info) return null;

  const clr = info.color;
  const duration = item?.effectDurationDays;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={s.backdrop}>
        <Animated.View style={[s.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={s.cardInner}>

            {/* Glowing icon */}
            <Animated.View style={[s.iconWrap, { transform: [{ scale: iconScale }] }]}>
              <Animated.View style={[s.iconGlow, { backgroundColor: clr, opacity: iconGlow }]} />
              <View style={[s.iconCircle, { borderColor: clr + '66' }]}>
                <Text style={s.iconEmoji}>{info.emoji}</Text>
              </View>
            </Animated.View>

            {/* Title */}
            <Text style={[s.title, { color: clr }]}>{info.title}</Text>
            {item?.name && <Text style={s.itemName}>{item.name}</Text>}

            {/* Duration badge */}
            {duration && (
              <View style={[s.durationBadge, { borderColor: clr + '44', backgroundColor: clr + '11' }]}>
                <Ionicons name="time-outline" size={14} color={clr} />
                <Text style={[s.durationText, { color: clr }]}>Dura {duration} días</Text>
              </View>
            )}

            {/* Effect cards */}
            <Animated.View style={[s.effectsWrap, { opacity: effectsOpacity, transform: [{ translateY: effectsY }] }]}>
              <Text style={s.sectionLabel}>¿QUÉ HACE?</Text>
              {info.effects.map((effect, i) => (
                <View key={i} style={[s.effectCard, { borderColor: clr + '22' }]}>
                  <View style={[s.effectIconWrap, { backgroundColor: clr + '15' }]}>
                    <Ionicons name={effect.icon} size={20} color={clr} />
                  </View>
                  <View style={s.effectTextWrap}>
                    <Text style={[s.effectWhere, { color: clr }]}>{effect.where}</Text>
                    <Text style={s.effectDesc}>{effect.desc}</Text>
                    {effect.descDetail && <Text style={s.effectDetail}>{effect.descDetail}</Text>}
                  </View>
                </View>
              ))}
            </Animated.View>

            {/* Button */}
            <Animated.View style={{ opacity: btnOpacity, width: '100%' }}>
              <AnimatedPressable style={s.btn} onPress={onClose} haptic="medium" scaleDown={0.95}>
                <View style={[s.btnInner, { backgroundColor: clr }]}>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={s.btnText}>ENTENDIDO</Text>
                </View>
              </AnimatedPressable>
            </Animated.View>

          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
  },
  cardInner: {
    padding: 28,
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },

  iconWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderWidth: 2,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 38 },

  title: {
    fontSize: 24,
    fontFamily: fonts.heading,
    letterSpacing: 2,
    textAlign: 'center',
  },
  itemName: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },

  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  durationText: { fontWeight: '800', fontSize: 13 },

  effectsWrap: { width: '100%', gap: 10 },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 2,
  },
  effectCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardLight,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  effectIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectTextWrap: { flex: 1, gap: 2 },
  effectWhere: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  effectDesc: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  effectDetail: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },

  btn: { overflow: 'hidden', width: '100%', marginTop: 4 },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  btnText: { color: '#fff', fontFamily: fonts.heading, fontSize: 20, letterSpacing: 2 },
});
