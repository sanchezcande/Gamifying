import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '../providers/AuthProvider';
import { useBattleData } from '../providers/BattleProvider';
import apiService from '../services/apiService';
import AvatarCircle from '../components/AvatarCircle';
import AvatarSprite, { CLASS_GLOW } from '../components/AvatarSprite';
import AnimatedPressable from '../components/AnimatedPressable';
import LoadingScreen from '../components/LoadingScreen';
import {
  AmbientParticles,
  CLASS_EMOJI,
  CLASS_SPARKS,
  ColorFlash,
  MagicCircle,
  ParticleExplosion,
  ShockWave,
} from '../components/BattleEffects';
import { colors, fonts, radius } from '../theme/theme';

let Haptics;
try { Haptics = require('expo-haptics'); } catch {}

const { width: SCREEN_W } = Dimensions.get('window');

const CLASS_MOVES = {
  WARRIOR:  { name: 'WARRIOR SLAM',    icon: '🔥', color: '#CC0000', gradient: ['#3a0000', '#140000'] },
  CHAMPION: { name: 'CHAMPION STRIKE', icon: '⚡', color: '#3B82F6', gradient: ['#071630', '#030a18'] },
  FIGHTER:  { name: 'POWER PUNCH',     icon: '💥', color: '#22C55E', gradient: ['#062010', '#020d06'] },
  ROOKIE:   { name: 'WILD HIT',        icon: '👊', color: '#888888', gradient: ['#181818', '#0a0a0a'] },
};

const SPECIAL_MOVES = {
  WARRIOR:  { name: 'INFERNO SLAM',    emoji: '🌋', color: '#FF2200' },
  CHAMPION: { name: 'THUNDER STRIKE',  emoji: '⚡', color: '#3B82F6' },
  FIGHTER:  { name: 'EMERALD CRUSHER', emoji: '💚', color: '#22C55E' },
  ROOKIE:   { name: 'WILD SWING',      emoji: '👊', color: '#aaaaaa' },
};

const SUPP_ICONS = {
  PROTEIN: '💪', CREATINE: '⚡', PREWORKOUT: '🚀', AURA: '🔥', STREAK_SHIELD: '🛡',
};

// ── Move definitions for the picker ──────────────────────────────────────────
const BATTLE_MOVES = {
  ATTACK: {
    id: 'ATTACK', name: 'ATACAR', emoji: '👊',
    desc: 'Golpe directo basado en tu Músculo',
    color: '#FF6B35', isSpecial: false,
  },
  DEFEND: {
    id: 'DEFEND', name: 'DEFENDER', emoji: '🛡',
    desc: 'Reducís el daño 60% + contra-golpe',
    color: '#22C55E', isSpecial: false,
  },
  PROTEIN_SURGE: {
    id: 'PROTEIN_SURGE', name: 'PROTEIN SURGE', emoji: '💪',
    desc: 'Golpe de fuerza devastador',
    color: '#22C55E', isSpecial: true, supplement: 'PROTEIN',
  },
  CREATINE_BLAST: {
    id: 'CREATINE_BLAST', name: 'CREATINE BLAST', emoji: '⚡',
    desc: 'Descarga de poder brutal',
    color: '#3B82F6', isSpecial: true, supplement: 'CREATINE',
  },
  PREWORKOUT_RUSH: {
    id: 'PREWORKOUT_RUSH', name: 'RUSH', emoji: '🚀',
    desc: 'Atacás primero + daño extra',
    color: '#FF6B35', isSpecial: true, supplement: 'PREWORKOUT',
  },
  AURA_BURST: {
    id: 'AURA_BURST', name: 'AURA BURST', emoji: '🔥',
    desc: 'Daño total + te curás 15 HP',
    color: '#CC0000', isSpecial: true, supplement: 'AURA',
  },
};

const SUPPLEMENT_TO_MOVE = {
  PROTEIN: 'PROTEIN_SURGE',
  CREATINE: 'CREATINE_BLAST',
  PREWORKOUT: 'PREWORKOUT_RUSH',
  AURA: 'AURA_BURST',
};

// ─── Move Picker Modal ───────────────────────────────────────────────────────
function MovePickerModal({ visible, target, me, onCancel, onFight, fighting }) {
  const insets = useSafeAreaInsets();
  const [moves, setMoves] = useState([null, null, null]);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Get available special moves from active supplements
  const activeCategories = (me?.activeSupplements || [])
    .map(s => s.shopItem?.category || s.category)
    .filter(cat => SUPPLEMENT_TO_MOVE[cat]);
  const availableSpecials = activeCategories.map(cat => SUPPLEMENT_TO_MOVE[cat]);

  useEffect(() => {
    if (visible) {
      setMoves([null, null, null]);
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const usedSpecials = new Set(moves.filter(m => m && BATTLE_MOVES[m]?.isSpecial));
  const allPicked = moves.every(m => m !== null);
  const myMove = CLASS_MOVES[me?.avatarClass] || CLASS_MOVES.ROOKIE;

  const pickMove = (roundIdx, moveId) => {
    if (Haptics && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setMoves(prev => {
      const next = [...prev];
      next[roundIdx] = next[roundIdx] === moveId ? null : moveId;
      return next;
    });
  };

  const handleFight = () => {
    if (!allPicked || fighting) return;
    if (Haptics && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onFight(moves);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={mp.backdrop}>
        <Animated.View style={[mp.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <ScrollView style={{ maxHeight: '100%' }} contentContainerStyle={[mp.inner, { paddingBottom: insets.bottom + 16 }]} showsVerticalScrollIndicator={false}>

            {/* VS Header */}
            <View style={mp.vsRow}>
              <View style={mp.vsFighter}>
                <AvatarCircle name={me?.name} avatarClass={me?.avatarClass} bodyStage={me?.avatarBodyStage} size="medium" profilePhoto={me?.profilePhoto} />
                <Text style={[mp.vsName, { color: myMove.color }]}>{me?.name?.split(' ')[0]}</Text>
              </View>
              <Text style={mp.vsText}>VS</Text>
              <View style={mp.vsFighter}>
                <AvatarCircle name={target?.name} avatarClass={target?.avatarClass} bodyStage={target?.avatarBodyStage} size="medium" profilePhoto={target?.profilePhoto} />
                <Text style={mp.vsName}>{target?.name?.split(' ')[0]}</Text>
              </View>
            </View>

            <Text style={mp.title}>ELEGÍ TUS MOVIMIENTOS</Text>
            <Text style={mp.subtitle}>Uno por round. Los especiales se usan 1 sola vez.</Text>

            {/* Round pickers */}
            {[0, 1, 2].map(roundIdx => (
              <View key={roundIdx} style={mp.roundSection}>
                <Text style={mp.roundLabel}>ROUND {roundIdx + 1}</Text>
                <View style={mp.movesRow}>
                  {/* Base moves */}
                  {['ATTACK', 'DEFEND'].map(moveId => {
                    const move = BATTLE_MOVES[moveId];
                    const selected = moves[roundIdx] === moveId;
                    return (
                      <AnimatedPressable
                        key={moveId}
                        style={[mp.moveCard, selected && { borderColor: move.color, backgroundColor: move.color + '15' }]}
                        onPress={() => pickMove(roundIdx, moveId)}
                        scaleDown={0.93}
                        haptic={null}
                      >
                        <Text style={mp.moveEmoji}>{move.emoji}</Text>
                        <Text style={[mp.moveName, selected && { color: move.color }]}>{move.name}</Text>
                        <Text style={mp.moveDesc}>{move.desc}</Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>

                {/* Special moves row */}
                {availableSpecials.length > 0 && (
                  <View style={mp.movesRow}>
                    {availableSpecials.map(moveId => {
                      const move = BATTLE_MOVES[moveId];
                      const selected = moves[roundIdx] === moveId;
                      const usedInOtherRound = usedSpecials.has(moveId) && moves[roundIdx] !== moveId;
                      return (
                        <AnimatedPressable
                          key={moveId}
                          style={[
                            mp.moveCard, mp.moveCardSpecial,
                            { borderColor: move.color + '44' },
                            selected && { borderColor: move.color, backgroundColor: move.color + '15' },
                            usedInOtherRound && { opacity: 0.3 },
                          ]}
                          onPress={() => !usedInOtherRound && pickMove(roundIdx, moveId)}
                          disabled={usedInOtherRound}
                          scaleDown={0.93}
                          haptic={null}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={mp.moveEmoji}>{move.emoji}</Text>
                            <View style={[mp.specialBadge, { backgroundColor: move.color + '22' }]}>
                              <Text style={[mp.specialBadgeText, { color: move.color }]}>ESPECIAL</Text>
                            </View>
                          </View>
                          <Text style={[mp.moveName, selected && { color: move.color }]}>{move.name}</Text>
                          <Text style={mp.moveDesc}>{usedInOtherRound ? 'Ya lo usaste' : move.desc}</Text>
                        </AnimatedPressable>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}

            {/* No supplements hint */}
            {availableSpecials.length === 0 && (
              <View style={mp.hintBox}>
                <Ionicons name="information-circle" size={16} color={colors.textMuted} />
                <Text style={mp.hintText}>Comprá suplementos en la tienda para desbloquear movimientos especiales</Text>
              </View>
            )}

            {/* Fight button */}
            <AnimatedPressable
              style={[mp.fightBtn, (!allPicked || fighting) && { opacity: 0.4 }]}
              onPress={handleFight}
              disabled={!allPicked || fighting}
              haptic={null}
              scaleDown={0.95}
            >
              <LinearGradient colors={allPicked ? ['#E00', '#900'] : [colors.border, colors.borderLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={mp.fightBtnGrad}>
                <Ionicons name="flash" size={20} color="#fff" />
                <Text style={mp.fightBtnText}>{fighting ? 'PELEANDO...' : allPicked ? 'PELEAR' : 'ELEGÍ LOS 3 MOVIMIENTOS'}</Text>
              </LinearGradient>
            </AnimatedPressable>

            <Pressable style={mp.cancelBtn} onPress={onCancel} disabled={fighting}>
              <Text style={mp.cancelText}>Cancelar</Text>
            </Pressable>

          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const mp = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 14 },
  card: { maxHeight: '92%', borderRadius: 20, overflow: 'hidden', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  inner: { padding: 20 },

  vsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 },
  vsFighter: { alignItems: 'center', gap: 6 },
  vsName: { color: colors.textSecondary, fontWeight: '800', fontSize: 12 },
  vsText: { color: colors.textPrimary, fontWeight: '900', fontSize: 22 },

  title: { color: colors.textPrimary, fontWeight: '900', fontSize: 18, letterSpacing: 0.5, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 16 },

  roundSection: { marginBottom: 14 },
  roundLabel: { color: colors.textMuted, fontWeight: '900', fontSize: 11, letterSpacing: 2, marginBottom: 8 },
  movesRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },

  moveCard: {
    flex: 1, backgroundColor: colors.cardLight, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    padding: 10, gap: 3,
  },
  moveCardSpecial: { backgroundColor: '#fff' },
  moveEmoji: { fontSize: 20 },
  moveName: { color: colors.textPrimary, fontWeight: '800', fontSize: 12 },
  moveDesc: { color: colors.textMuted, fontSize: 10, lineHeight: 14 },
  specialBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  specialBadgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },

  hintBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.cardLight, borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  hintText: { color: colors.textMuted, fontSize: 11, flex: 1, lineHeight: 16 },

  fightBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  fightBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  fightBtnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },

  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
});

// ─── HP Bar ───────────────────────────────────────────────────────────────────
function HPBar({ hpAnim, color, flip }) {
  const scaleX = hpAnim.interpolate({ inputRange: [0, 100], outputRange: [0, 1] });
  return (
    <View style={[hp.track, flip && { flexDirection: 'row-reverse' }]}>
      <Animated.View style={[hp.fill, {
        backgroundColor: color,
        shadowColor: color, shadowRadius: 6, shadowOpacity: 0.8,
        transform: [{ scaleX }],
        transformOrigin: flip ? 'right center' : 'left center',
      }]} />
    </View>
  );
}
const hp = StyleSheet.create({
  track: { height: 8, backgroundColor: colors.border, borderRadius: 99, overflow: 'hidden', flex: 1 },
  fill:  { height: '100%', width: '100%', borderRadius: 99 },
});

// ─── Damage Number Float ──────────────────────────────────────────────────────
function DamageFloat({ value, color, heal }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] });
  const opacity = anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
  return (
    <Animated.Text style={[dmgStyle.text, { color, opacity, transform: [{ translateY }] }]}>
      {heal ? `+${value}` : `-${value}`}
    </Animated.Text>
  );
}
const dmgStyle = StyleSheet.create({
  text: { position: 'absolute', top: -10, fontWeight: '900', fontSize: 24, textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } },
});

// ─── Battle Animation Modal ────────────────────────────────────────────────────
function BattleModal({ open, result, me, target, onClose }) {
  const won = result?.winnerId === me?.id;
  const rounds = result?.rounds || [];

  // Positions
  const myX        = useRef(new Animated.Value(-SCREEN_W)).current;
  const theirX     = useRef(new Animated.Value(SCREEN_W)).current;
  const myLunge    = useRef(new Animated.Value(0)).current;
  const theirLunge = useRef(new Animated.Value(0)).current;

  // Charge auras
  const myChargeScale      = useRef(new Animated.Value(1)).current;
  const theirChargeScale   = useRef(new Animated.Value(1)).current;
  const myChargeOpacity    = useRef(new Animated.Value(0)).current;
  const theirChargeOpacity = useRef(new Animated.Value(0)).current;

  // Hit reactions
  const myHitX       = useRef(new Animated.Value(0)).current;
  const theirHitX    = useRef(new Animated.Value(0)).current;
  const myOpacity    = useRef(new Animated.Value(1)).current;
  const theirOpacity = useRef(new Animated.Value(1)).current;
  const myTilt       = useRef(new Animated.Value(0)).current;
  const theirTilt    = useRef(new Animated.Value(0)).current;

  // Winner bounce
  const winnerScale = useRef(new Animated.Value(1)).current;

  // HP bars
  const myHP    = useRef(new Animated.Value(100)).current;
  const theirHP = useRef(new Animated.Value(100)).current;

  // Screen effects
  const shakeX       = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const colorFlash   = useRef(new Animated.Value(0)).current;
  const darkOverlay  = useRef(new Animated.Value(0)).current;

  // Impact
  const impactOpacity = useRef(new Animated.Value(0)).current;
  const impactScale   = useRef(new Animated.Value(0)).current;

  // Round announcement
  const roundOpacity = useRef(new Animated.Value(0)).current;
  const roundScale   = useRef(new Animated.Value(1.4)).current;

  // Move name flash
  const moveNameOpacity = useRef(new Animated.Value(0)).current;
  const moveNameScale   = useRef(new Animated.Value(0.6)).current;

  // Result
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultY       = useRef(new Animated.Value(50)).current;

  // UI state
  const [phase, setPhase]         = useState('idle');
  const [roundText, setRoundText] = useState('');
  const [moveName, setMoveName]   = useState('');
  const [showHP, setShowHP]       = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [dmgFloats, setDmgFloats]   = useState([]);

  const [impactKey, setImpactKey] = useState(0);
  const [shockKey, setShockKey]   = useState(0);

  const [showMagicMe, setShowMagicMe]       = useState(false);
  const [showMagicThem, setShowMagicThem]    = useState(false);
  const [showAmbientMe, setShowAmbientMe]   = useState(false);
  const [showAmbientThem, setShowAmbientThem] = useState(false);

  const myGlow    = CLASS_GLOW[me?.avatarClass]     || '#888';
  const theirGlow = CLASS_GLOW[target?.avatarClass]  || '#888';
  const mySparks  = CLASS_SPARKS[me?.avatarClass]    || CLASS_SPARKS.ROOKIE;
  const theirSparks = CLASS_SPARKS[target?.avatarClass] || CLASS_SPARKS.ROOKIE;
  const myEmoji   = CLASS_EMOJI[me?.avatarClass]     || '✨';
  const theirEmoji = CLASS_EMOJI[target?.avatarClass] || '✨';
  const winnerGlow = won ? myGlow : theirGlow;

  const timers = useRef([]);
  const T = (ms, fn) => { const id = setTimeout(fn, ms); timers.current.push(id); };

  // Helpers
  const shake = (intensity = 12) => Animated.sequence([
    Animated.timing(shakeX, { toValue: -intensity, duration: 50, useNativeDriver: true }),
    Animated.timing(shakeX, { toValue:  intensity, duration: 50, useNativeDriver: true }),
    Animated.timing(shakeX, { toValue: -intensity * 0.7, duration: 40, useNativeDriver: true }),
    Animated.timing(shakeX, { toValue:  intensity * 0.7, duration: 40, useNativeDriver: true }),
    Animated.timing(shakeX, { toValue: 0, duration: 30, useNativeDriver: true }),
  ]);

  const flash = (val = 1, dur = 60) => Animated.sequence([
    Animated.timing(flashOpacity, { toValue: val, duration: dur, useNativeDriver: true }),
    Animated.timing(flashOpacity, { toValue: 0, duration: dur * 4, useNativeDriver: true }),
  ]);

  const showRound = (text, cb) => {
    setRoundText(text);
    roundOpacity.setValue(0); roundScale.setValue(1.5);
    Animated.parallel([
      Animated.timing(roundOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.spring(roundScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start(() => { setTimeout(() => { Animated.timing(roundOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(cb); }, 700); });
  };

  const showMoveBanner = (name, cb) => {
    setMoveName(name);
    moveNameOpacity.setValue(0); moveNameScale.setValue(0.5);
    Animated.parallel([
      Animated.timing(moveNameOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.spring(moveNameScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start(() => { setTimeout(() => { Animated.timing(moveNameOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(cb); }, 800); });
  };

  const lunge = (attacker, dir, cb, isMega = false) => {
    const lv = attacker === 'me' ? myLunge : theirLunge;
    const offset = dir * SCREEN_W * 0.28;
    Animated.timing(lv, { toValue: offset, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      flash();
      shake(isMega ? 20 : 12);
      setImpactKey(k => k + 1);
      setShockKey(k => k + 1);
      impactOpacity.setValue(0); impactScale.setValue(0);
      Animated.parallel([
        Animated.spring(impactScale, { toValue: 1, friction: isMega ? 2 : 3, tension: 200, useNativeDriver: true }),
        Animated.timing(impactOpacity, { toValue: 1, duration: 60, useNativeDriver: true }),
      ]).start();
      setTimeout(() => Animated.timing(impactOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(), 300);
      setTimeout(() => Animated.spring(lv, { toValue: 0, friction: 6, useNativeDriver: true }).start(cb), 180);
    });
  };

  const hitReaction = (tgt, dir) => {
    const hitX = tgt === 'me' ? myHitX : theirHitX;
    const opac = tgt === 'me' ? myOpacity : theirOpacity;
    Animated.sequence([
      Animated.timing(hitX, { toValue: dir * 18, duration: 100, useNativeDriver: true }),
      Animated.timing(hitX, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(opac, { toValue: 0.3, duration: 70, useNativeDriver: true }),
      Animated.timing(opac, { toValue: 1, duration: 70, useNativeDriver: true }),
    ]), { iterations: 3 }).start();
  };

  const chargeUp = (fighter) => {
    const scale = fighter === 'me' ? myChargeScale : theirChargeScale;
    const opac = fighter === 'me' ? myChargeOpacity : theirChargeOpacity;
    opac.setValue(1);
    if (fighter === 'me') { setShowMagicMe(true); setShowAmbientMe(true); }
    else { setShowMagicThem(true); setShowAmbientThem(true); }
    return Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.18, duration: 300, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]), { iterations: 3 });
  };

  const stopCharge = (fighter) => {
    (fighter === 'me' ? myChargeOpacity : theirChargeOpacity).setValue(0);
    (fighter === 'me' ? myChargeScale : theirChargeScale).setValue(1);
    if (fighter === 'me') { setShowMagicMe(false); setShowAmbientMe(false); }
    else { setShowMagicThem(false); setShowAmbientThem(false); }
  };

  const addDmgFloat = (side, value, heal = false) => {
    const id = Date.now() + Math.random();
    const color = heal ? '#22C55E' : '#FF4444';
    setDmgFloats(prev => [...prev, { id, side, value, color, heal }]);
    setTimeout(() => setDmgFloats(prev => prev.filter(d => d.id !== id)), 1500);
  };

  const resetAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase('idle'); setRoundText(''); setMoveName('');
    setShowHP(false); setShowResult(false); setDmgFloats([]);
    setShowMagicMe(false); setShowMagicThem(false);
    setShowAmbientMe(false); setShowAmbientThem(false);
    [myLunge, myHitX, myTilt, myChargeOpacity].forEach(v => v.setValue(0));
    [theirLunge, theirHitX, theirTilt, theirChargeOpacity].forEach(v => v.setValue(0));
    myX.setValue(-SCREEN_W); theirX.setValue(SCREEN_W);
    myOpacity.setValue(1); theirOpacity.setValue(1);
    myHP.setValue(100); theirHP.setValue(100);
    myChargeScale.setValue(1); theirChargeScale.setValue(1);
    winnerScale.setValue(1);
    shakeX.setValue(0); flashOpacity.setValue(0); darkOverlay.setValue(0);
    colorFlash.setValue(0);
    impactOpacity.setValue(0); impactScale.setValue(0);
    roundOpacity.setValue(0); moveNameOpacity.setValue(0);
    resultOpacity.setValue(0); resultY.setValue(50);
  };

  useEffect(() => {
    if (!open || rounds.length === 0) { resetAll(); return; }

    setPhase('enter');

    // Entrance
    Animated.parallel([
      Animated.spring(myX, { toValue: 0, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.spring(theirX, { toValue: 0, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start();

    T(1000, () => setShowHP(true));

    // Animate each round
    const animateRound = (roundIdx, startTime) => {
      const rd = rounds[roundIdx];
      if (!rd) return startTime;
      const isLast = roundIdx === rounds.length - 1;
      const roundLabel = isLast && rounds.length === 3 ? '⚡ ROUND FINAL ⚡' : `ROUND ${roundIdx + 1}`;

      // Get move display names
      const myMoveInfo = BATTLE_MOVES[rd.challengerMove] || { emoji: '👊', name: rd.challengerMove };
      const theirMoveInfo = BATTLE_MOVES[rd.defenderMove] || { emoji: '👊', name: rd.defenderMove };
      const myIsSpecial = myMoveInfo.isSpecial;
      const theirIsSpecial = theirMoveInfo?.isSpecial;

      // Round announcement
      T(startTime, () => showRound(roundLabel, () => {
        setPhase(`round${roundIdx + 1}`);

        // Show move names
        const moveText = `${myMoveInfo.emoji} ${myMoveInfo.name}  vs  ${theirMoveInfo.emoji} ${theirMoveInfo.name}`;
        showMoveBanner(moveText, () => {});

        // Dark overlay for final round
        if (isLast) {
          Animated.timing(darkOverlay, { toValue: 0.5, duration: 300, useNativeDriver: true }).start();
        }

        // My attack
        T(800, () => {
          if (rd.challengerMove !== 'DEFEND') {
            const c = chargeUp('me');
            c.start();
            T(700, () => {
              c.stop(); stopCharge('me');
              lunge('me', 1, () => {
                hitReaction('them', 2);
                addDmgFloat('them', rd.challengerDamageDealt);
                Animated.timing(theirHP, { toValue: rd.defenderHP, duration: 400, useNativeDriver: true }).start();
              }, isLast && myIsSpecial);
            });
          } else {
            // Defend pose - just show shield
            addDmgFloat('me', rd.defenderDamageDealt);
          }
        });

        // Their attack
        T(2000, () => {
          if (isLast) {
            Animated.timing(darkOverlay, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          }
          if (rd.defenderMove !== 'DEFEND') {
            const c2 = chargeUp('them');
            c2.start();
            T(700, () => {
              c2.stop(); stopCharge('them');
              lunge('them', -1, () => {
                hitReaction('me', -2);
                addDmgFloat('me', rd.defenderDamageDealt);
                Animated.timing(myHP, { toValue: rd.challengerHP, duration: 400, useNativeDriver: true }).start();
              }, isLast && theirIsSpecial);
            });
          } else {
            addDmgFloat('them', rd.challengerDamageDealt);
            Animated.timing(myHP, { toValue: rd.challengerHP, duration: 400, useNativeDriver: true }).start();
            Animated.timing(theirHP, { toValue: rd.defenderHP, duration: 400, useNativeDriver: true }).start();
          }
        });

        // Heals
        if (rd.challengerHeal > 0) {
          T(2800, () => addDmgFloat('me', rd.challengerHeal, true));
        }
        if (rd.defenderHeal > 0) {
          T(2800, () => addDmgFloat('them', rd.defenderHeal, true));
        }

        // KO check (if someone drops to 0)
        if (isLast || rd.challengerHP <= 0 || rd.defenderHP <= 0) {
          T(3500, () => {
            // Color flash
            Animated.sequence([
              Animated.timing(colorFlash, { toValue: 1, duration: 80, useNativeDriver: true }),
              Animated.timing(colorFlash, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]).start();

            // Loser KO animation
            const loserHitX = won ? theirHitX : myHitX;
            const loserOpac = won ? theirOpacity : myOpacity;
            const loserTilt = won ? theirTilt : myTilt;
            const dir = won ? 1 : -1;
            Animated.parallel([
              Animated.timing(loserHitX, { toValue: dir * 60, duration: 400, useNativeDriver: true }),
              Animated.timing(loserTilt, { toValue: dir * 25, duration: 400, useNativeDriver: true }),
              Animated.timing(loserOpac, { toValue: 0.15, duration: 600, useNativeDriver: true }),
            ]).start();
            flash(0.9, 80);

            // Winner victory bounce
            T(700, () => {
              setPhase('victory');
              Animated.loop(Animated.sequence([
                Animated.spring(winnerScale, { toValue: 1.15, friction: 4, useNativeDriver: true }),
                Animated.spring(winnerScale, { toValue: 1, friction: 4, useNativeDriver: true }),
              ]), { iterations: 4 }).start();
            });

            // Result reveal
            T(1500, () => {
              setShowResult(true);
              Animated.parallel([
                Animated.timing(resultOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.spring(resultY, { toValue: 0, friction: 6, useNativeDriver: true }),
              ]).start();
            });
          });
        }
      }));

      // Each round takes ~4.5 seconds, final round takes ~6 seconds
      return startTime + (isLast ? 6500 : 4500);
    };

    let time = 1600;
    for (let i = 0; i < rounds.length; i++) {
      time = animateRound(i, time);
    }
  }, [open]);

  const myMove = CLASS_MOVES[me?.avatarClass] || CLASS_MOVES.ROOKIE;
  const mySupps = (me?.activeSupplements || []).map(i => SUPP_ICONS[i.shopItem?.category]).filter(Boolean);

  return (
    <Modal visible={open} animationType="fade" transparent statusBarTranslucent>
      <View style={b.backdrop}>
        <Animated.View style={[b.flash, { opacity: flashOpacity, backgroundColor: '#fff' }]} pointerEvents="none" />
        <Animated.View style={[b.flash, { opacity: colorFlash, backgroundColor: winnerGlow }]} pointerEvents="none" />
        <Animated.View style={[b.flash, { opacity: darkOverlay, backgroundColor: '#000' }]} pointerEvents="none" />

        <LinearGradient colors={[colors.background, '#E8E3D8', '#DDD8CD']} style={b.screen}>

          {/* HP Bars */}
          {showHP && (
            <View style={b.hpSection}>
              <View style={b.hpRow}>
                <Text style={[b.hpName, { color: myGlow }]} numberOfLines={1}>{me?.name?.split(' ')[0]}</Text>
                <HPBar hpAnim={myHP} color={myGlow} flip={false} />
              </View>
              <View style={[b.hpRow, { flexDirection: 'row-reverse' }]}>
                <Text style={[b.hpName, { color: theirGlow, textAlign: 'right' }]} numberOfLines={1}>{target?.name?.split(' ')[0]}</Text>
                <HPBar hpAnim={theirHP} color={theirGlow} flip={true} />
              </View>
            </View>
          )}

          {/* Arena */}
          <Animated.View style={[b.arena, { transform: [{ translateX: shakeX }] }]}>

            {/* ME */}
            <Animated.View style={[b.fighterSlot, {
              transform: [
                { translateX: Animated.add(Animated.add(myX, myLunge), myHitX) },
                { rotate: myTilt.interpolate({ inputRange: [-45, 45], outputRange: ['-45deg', '45deg'] }) },
                { scale: won ? winnerScale : myChargeScale },
              ],
              opacity: myOpacity,
            }]}>
              <MagicCircle color={myGlow} size={130} visible={showMagicMe} />
              <Animated.View style={[b.auraGlow, {
                backgroundColor: myGlow + '44', opacity: myChargeOpacity,
                transform: [{ scale: myChargeScale }],
                shadowColor: myGlow, shadowRadius: 30, shadowOpacity: 1,
              }]} />
              {showAmbientMe && <AmbientParticles emoji={myEmoji} count={5} />}
              <AvatarSprite avatarClass={me?.avatarClass} bodyStage={me?.avatarBodyStage} size={80} flip={false} glowColor={myGlow} idle={phase === 'enter'} />
              <Text style={[b.fighterName, { color: myGlow }]} numberOfLines={1}>{me?.name}</Text>
              {mySupps.length > 0 && <Text style={b.supps}>{mySupps.join(' ')}</Text>}
              {phase === 'victory' && won && <Text style={b.crownBadge}>👑</Text>}
              {/* Damage floats */}
              {dmgFloats.filter(d => d.side === 'me').map(d => (
                <DamageFloat key={d.id} value={d.value} color={d.color} heal={d.heal} />
              ))}
            </Animated.View>

            {/* CENTER */}
            <View style={b.centerCol} pointerEvents="none">
              <Animated.Text style={[b.roundText, { opacity: roundOpacity, transform: [{ scale: roundScale }] }]}>
                {roundText}
              </Animated.Text>
              <Animated.Text style={[b.impactEmoji, { opacity: impactOpacity, transform: [{ scale: impactScale }] }]}>
                💥
              </Animated.Text>
              <ParticleExplosion trigger={impactKey} colors={[...mySparks, ...theirSparks]} count={36} />
              <ShockWave trigger={shockKey} color={winnerGlow} />
            </View>

            {/* OPPONENT */}
            <Animated.View style={[b.fighterSlot, {
              transform: [
                { translateX: Animated.add(Animated.add(theirX, theirLunge), theirHitX) },
                { rotate: theirTilt.interpolate({ inputRange: [-45, 45], outputRange: ['-45deg', '45deg'] }) },
                { scale: !won ? winnerScale : theirChargeScale },
              ],
              opacity: theirOpacity,
            }]}>
              <MagicCircle color={theirGlow} size={130} visible={showMagicThem} />
              <Animated.View style={[b.auraGlow, {
                backgroundColor: theirGlow + '44', opacity: theirChargeOpacity,
                transform: [{ scale: theirChargeScale }],
                shadowColor: theirGlow, shadowRadius: 30, shadowOpacity: 1,
              }]} />
              {showAmbientThem && <AmbientParticles emoji={theirEmoji} count={5} />}
              <AvatarSprite avatarClass={target?.avatarClass} bodyStage={target?.avatarBodyStage} size={80} flip={true} glowColor={theirGlow} idle={phase === 'enter'} />
              <Text style={[b.fighterName, { color: theirGlow }]} numberOfLines={1}>{target?.name}</Text>
              {phase === 'victory' && !won && <Text style={b.crownBadge}>👑</Text>}
              {dmgFloats.filter(d => d.side === 'them').map(d => (
                <DamageFloat key={d.id} value={d.value} color={d.color} heal={d.heal} />
              ))}
            </Animated.View>

          </Animated.View>

          {/* Move name banner */}
          <Animated.View style={[b.moveNameWrap, { opacity: moveNameOpacity, transform: [{ scale: moveNameScale }] }]}>
            <Text style={b.moveNameText}>{moveName}</Text>
          </Animated.View>

          {/* Result */}
          {showResult && (
            <Animated.View style={[b.resultBox, { opacity: resultOpacity, transform: [{ translateY: resultY }] }]}>
              <Text style={[b.resultTitle, { color: won ? colors.textPrimary : colors.textMuted, textShadowColor: won ? winnerGlow : 'transparent' }]}>
                {won ? 'VICTORIA' : 'DERROTA'}
              </Text>
              {won ? (
                <View style={b.rewardsRow}>
                  <View style={b.rewardPill}>
                    <Text style={[b.rewardVal, { color: '#D4AF37' }]}>+{result?.gcEarned || 0}</Text>
                    <Text style={b.rewardLbl}>GAINS</Text>
                  </View>
                  <View style={[b.rewardPill, { borderColor: colors.power + '30' }]}>
                    <Text style={[b.rewardVal, { color: colors.power }]}>+{result?.xpEarned || 0}</Text>
                    <Text style={b.rewardLbl}>PODER</Text>
                  </View>
                </View>
              ) : (
                <Text style={b.motto}>Seguí entrenando. Volvé más fuerte.</Text>
              )}
              <Pressable
                style={[b.closeBtn, { backgroundColor: won ? colors.accent : colors.cardLight, borderColor: won ? colors.accent : colors.border }]}
                onPress={onClose}
              >
                <Text style={[b.closeBtnText, { color: won ? '#fff' : colors.textPrimary }]}>{won ? 'RECLAMAR VICTORIA' : 'VOLVER'}</Text>
              </Pressable>
            </Animated.View>
          )}

        </LinearGradient>
      </View>
    </Modal>
  );
}

// ─── Video Battle Modal (AI-generated battle video experience) ────────────────
const HYPE_MESSAGES = [
  'PREPARANDO LA ARENA',
  'LOS LUCHADORES SE CALIENTAN',
  'GENERANDO BATALLA EPICA',
  'ESTO SE VA A PONER BUENO',
  'CARGANDO MOVIMIENTOS ESPECIALES',
  'LA ARENA ESTA LISTA',
];

function VideoBattleModal({ open, battleId, result, me, target, onClose }) {
  const [phase, setPhase] = useState('loading'); // loading | playing | result
  const [videoUrl, setVideoUrl] = useState(null);
  const [hypeIdx, setHypeIdx] = useState(0);
  const videoRef = useRef(null);
  const pollRef = useRef(null);
  const hypeRef = useRef(null);
  const timeoutRef = useRef(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultY = useRef(new Animated.Value(50)).current;
  const loadProgress = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const won = result?.winnerId === me?.id;
  const myGlow = CLASS_GLOW[me?.avatarClass] || '#888';
  const theirGlow = CLASS_GLOW[target?.avatarClass] || '#888';
  const winnerGlow = won ? myGlow : theirGlow;

  const cleanup = () => {
    clearInterval(pollRef.current);
    clearInterval(hypeRef.current);
    clearTimeout(timeoutRef.current);
  };

  const showResults = () => {
    cleanup();
    setPhase('result');
    if (Haptics && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    resultOpacity.setValue(0);
    resultY.setValue(50);
    Animated.parallel([
      Animated.timing(resultOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(resultY, { toValue: 0, friction: 6, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (!open || !battleId) return;

    setPhase('loading');
    setVideoUrl(null);
    setHypeIdx(0);
    resultOpacity.setValue(0);
    resultY.setValue(50);
    loadProgress.setValue(0);

    // Fake progress bar — fills to ~85% over 60s
    Animated.timing(loadProgress, {
      toValue: 0.85, duration: 60000,
      easing: Easing.out(Easing.quad), useNativeDriver: false,
    }).start();

    // Pulse VS animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Glow ring pulse
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
      ])
    );
    glow.start();

    // Cycle hype messages
    hypeRef.current = setInterval(() => {
      setHypeIdx(i => (i + 1) % HYPE_MESSAGES.length);
    }, 3500);

    // Poll for video status
    const poll = async () => {
      try {
        const res = await apiService.getBattleVideo(battleId);
        const d = res.data;
        if (d?.videoStatus === 'DONE' && d?.videoUrl) {
          loadProgress.stopAnimation();
          Animated.timing(loadProgress, { toValue: 1, duration: 500, useNativeDriver: false }).start(() => {
            setVideoUrl(d.videoUrl);
            setPhase('playing');
          });
          clearInterval(pollRef.current);
        } else if (d?.videoStatus === 'FAILED') {
          clearInterval(pollRef.current);
          showResults();
        }
      } catch {}
    };
    pollRef.current = setInterval(poll, 5000);
    setTimeout(poll, 3000);

    // Timeout after 120s — show results directly
    timeoutRef.current = setTimeout(() => {
      clearInterval(pollRef.current);
      showResults();
    }, 120000);

    return () => { cleanup(); pulse.stop(); glow.stop(); };
  }, [open, battleId]);

  if (!open) return null;

  return (
    <Modal visible={open} animationType="fade" transparent statusBarTranslucent>
      <View style={vb.container}>
        <LinearGradient colors={['#080808', '#1a0808', '#080808']} style={vb.bg}>

          {/* Loading / Hype Phase */}
          {phase === 'loading' && (
            <View style={vb.hypeWrap}>
              <View style={vb.vsRow}>
                <View style={vb.vsFighter}>
                  <Animated.View style={[vb.glowRing, { borderColor: myGlow + '66', shadowColor: myGlow, opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }]}>
                    <AvatarCircle name={me?.name} avatarClass={me?.avatarClass} bodyStage={me?.avatarBodyStage} size="large" profilePhoto={me?.profilePhoto} />
                  </Animated.View>
                  <Text style={[vb.vsName, { color: myGlow }]}>{me?.name?.split(' ')[0]}</Text>
                </View>
                <Animated.Text style={[vb.vsText, { transform: [{ scale: pulseAnim }] }]}>VS</Animated.Text>
                <View style={vb.vsFighter}>
                  <Animated.View style={[vb.glowRing, { borderColor: theirGlow + '66', shadowColor: theirGlow, opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }]}>
                    <AvatarCircle name={target?.name} avatarClass={target?.avatarClass} bodyStage={target?.avatarBodyStage} size="large" profilePhoto={target?.profilePhoto} />
                  </Animated.View>
                  <Text style={[vb.vsName, { color: theirGlow }]}>{target?.name?.split(' ')[0]}</Text>
                </View>
              </View>

              <Text style={vb.hypeText}>{HYPE_MESSAGES[hypeIdx]}...</Text>

              <View style={vb.progressTrack}>
                <Animated.View style={[vb.progressFill, {
                  width: loadProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                }]} />
              </View>
            </View>
          )}

          {/* Video Playback Phase */}
          {phase === 'playing' && videoUrl && (
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              style={vb.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              onPlaybackStatusUpdate={(status) => {
                if (status.didJustFinish) showResults();
              }}
            />
          )}

          {/* Results Phase */}
          {phase === 'result' && (
            <Animated.View style={[vb.resultBox, { opacity: resultOpacity, transform: [{ translateY: resultY }] }]}>
              <Text style={vb.resultEmoji}>{won ? '\uD83D\uDC51' : '\uD83D\uDC80'}</Text>
              <Text style={[vb.resultTitle, { textShadowColor: won ? winnerGlow : 'transparent' }]}>
                {won ? 'VICTORIA' : 'DERROTA'}
              </Text>
              {won ? (
                <View style={vb.rewardsRow}>
                  <View style={vb.rewardPill}>
                    <Text style={[vb.rewardVal, { color: '#D4AF37' }]}>+{result?.gcEarned || 0}</Text>
                    <Text style={vb.rewardLbl}>GAINS</Text>
                  </View>
                  <View style={[vb.rewardPill, { borderColor: '#3B82F630' }]}>
                    <Text style={[vb.rewardVal, { color: '#3B82F6' }]}>+{result?.xpEarned || 0}</Text>
                    <Text style={vb.rewardLbl}>PODER</Text>
                  </View>
                </View>
              ) : (
                <Text style={vb.motto}>Segui entrenando. Volve mas fuerte.</Text>
              )}
              <Pressable style={[vb.closeBtn, { borderColor: won ? winnerGlow : '#444' }]} onPress={onClose}>
                <Text style={vb.closeBtnText}>{won ? 'RECLAMAR VICTORIA' : 'VOLVER'}</Text>
              </Pressable>
            </Animated.View>
          )}

        </LinearGradient>
      </View>
    </Modal>
  );
}

const vb = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hypeWrap: { alignItems: 'center', paddingHorizontal: 24, gap: 36 },
  vsRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  vsFighter: { alignItems: 'center', gap: 12 },
  glowRing: { borderWidth: 2, borderRadius: 99, padding: 4, shadowRadius: 25, shadowOpacity: 0.9, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
  vsName: { fontWeight: '900', fontSize: 15, letterSpacing: 1.5 },
  vsText: { color: '#CC0000', fontWeight: '900', fontSize: 40, letterSpacing: 6, textShadowColor: '#CC0000', textShadowRadius: 25, textShadowOffset: { width: 0, height: 0 } },
  hypeText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 2, textAlign: 'center', textShadowColor: '#CC000088', textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 } },
  progressTrack: { width: '80%', height: 3, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#CC0000', borderRadius: 2 },
  video: { width: '100%', height: '100%' },
  resultBox: { alignItems: 'center', gap: 16, paddingHorizontal: 24 },
  resultEmoji: { fontSize: 64 },
  resultTitle: { color: '#fff', fontSize: 42, fontWeight: '900', letterSpacing: 6, textShadowRadius: 30, textShadowOffset: { width: 0, height: 0 } },
  rewardsRow: { flexDirection: 'row', gap: 16 },
  rewardPill: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#D4AF3730', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', gap: 4 },
  rewardVal: { fontWeight: '900', fontSize: 24 },
  rewardLbl: { color: '#777', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  motto: { color: '#777', fontSize: 14 },
  closeBtn: { borderWidth: 2, borderRadius: 10, paddingVertical: 16, paddingHorizontal: 48, marginTop: 8 },
  closeBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 3 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BattleScreen() {
  const { user, refreshMe } = useAuth();
  const { battleHistory, loadHistory, challenge, pendingChallenges, loadPending, respondToChallenge, declineChallenge } = useBattleData();
  const [members, setMembers]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [challengeTarget, setChallengeTarget] = useState(null);
  const [fighting, setFighting]             = useState(false);
  const [battleState, setBattleState]       = useState({ open: false, result: null, target: null, battleId: null });
  const [battlesRemaining, setBattlesRemaining] = useState(null);
  const [monthlyAthletes, setMonthlyAthletes] = useState([]);
  const [respondTarget, setRespondTarget] = useState(null);
  const [responding, setResponding] = useState(false);

  const load = async () => {
    if (!user?.gymId || !user?.id) return;
    setLoading(true);
    try {
      const [membersRes, , remainingRes, monthlyRes] = await Promise.all([
        apiService.getGymMembers(user.gymId),
        loadHistory(user.id),
        apiService.getBattlesRemaining(),
        apiService.getMonthlyAthletes(user.gymId).catch(() => ({ data: [] })),
        loadPending(),
      ]);
      setMembers((membersRes.data || []).filter(m => m.id && m.id !== user.id));
      setBattlesRemaining(remainingRes.data);
      setMonthlyAthletes(monthlyRes.data || []);
    } catch (e) {
      Alert.alert('Battle', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const onFight = async (moves) => {
    if (!challengeTarget) return;
    try {
      setFighting(true);
      const result = await challenge(challengeTarget.id, moves);
      setChallengeTarget(null);
      // Now it's pending — show confirmation instead of battle
      Alert.alert('Desafío Enviado', `Le mandaste el desafío a ${challengeTarget.name}. Cuando acepte, se resuelve la pelea.`);
      await load(); // Refresh
    } catch (e) {
      Alert.alert('Battle', e.message);
    } finally {
      setFighting(false);
    }
  };

  const onRespond = async (moves) => {
    if (!respondTarget) return;
    try {
      setResponding(true);
      const result = await respondToChallenge(respondTarget.id, moves);
      const target = respondTarget;
      setRespondTarget(null);
      setBattleState({ open: true, result, target, battleId: result.battleId || null });
    } catch (e) {
      Alert.alert('Battle', e.message);
    } finally {
      setResponding(false);
    }
  };

  const insets = useSafeAreaInsets();

  if (loading) return <LoadingScreen />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <Ionicons name="flash" size={24} color={colors.textPrimary} />
        <Text style={styles.title}>BATALLA</Text>
        {battlesRemaining != null && (
          <View style={styles.remainingBadge}>
            <Text style={[styles.remainingText, battlesRemaining.remaining === 0 && { color: '#555' }]}>
              {battlesRemaining.remaining}/{battlesRemaining.limit}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.subtitle}>
        {battlesRemaining?.remaining === 0 ? 'No te quedan peleas esta semana' : 'Elegí un rival y armá tu estrategia'}
      </Text>

      <FlatList
        data={members}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        ListHeaderComponent={
          <>
            {pendingChallenges.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Ionicons name="notifications" size={16} color="#FF6B35" />
                  <Text style={[styles.subTitle, { color: '#FF6B35', marginBottom: 0 }]}>
                    DESAFÍOS PENDIENTES ({pendingChallenges.length})
                  </Text>
                </View>
                {pendingChallenges.map((ch) => {
                  const challenger = ch.challenger;
                  const move = CLASS_MOVES[challenger?.avatarClass] || CLASS_MOVES.ROOKIE;
                  const timeLeft = ch.expiresAt
                    ? Math.max(0, Math.floor((new Date(ch.expiresAt) - Date.now()) / 3600000))
                    : null;
                  return (
                    <View key={ch.id} style={[styles.memberRow, { borderLeftColor: '#FF6B35', borderLeftWidth: 3, backgroundColor: '#FF6B3508' }]}>
                      <AvatarCircle
                        name={challenger?.name}
                        avatarClass={challenger?.avatarClass}
                        bodyStage={challenger?.avatarBodyStage}
                        size="small"
                        profilePhoto={challenger?.profilePhoto}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.memberName}>{challenger?.name}</Text>
                        <Text style={[styles.moveName, { color: '#FF6B35' }]}>⚔️ Te desafió a pelear</Text>
                        {timeLeft !== null && (
                          <Text style={styles.memberMeta}>⏱ {timeLeft}h restantes</Text>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <AnimatedPressable
                          style={[styles.fightBtn, { borderColor: '#CC4444' }]}
                          onPress={() => declineChallenge(ch.id)}
                          haptic="light"
                          scaleDown={0.92}
                        >
                          <Ionicons name="close" size={16} color="#CC4444" />
                        </AnimatedPressable>
                        <AnimatedPressable
                          style={[styles.fightBtn, { borderColor: '#22C55E', backgroundColor: '#22C55E10' }]}
                          onPress={() => setRespondTarget({ ...ch, name: challenger?.name, avatarClass: challenger?.avatarClass, avatarBodyStage: challenger?.avatarBodyStage, statPower: challenger?.statPower, profilePhoto: challenger?.profilePhoto })}
                          haptic="medium"
                          scaleDown={0.92}
                        >
                          <Text style={[styles.fightText, { color: '#22C55E' }]}>ACEPTAR</Text>
                        </AnimatedPressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="shield-outline" size={40} color={colors.textDim} />
            <Text style={styles.empty}>No hay rivales en tu gym todavía.</Text>
          </View>
        }
        ListFooterComponent={
          <>
            {battleHistory.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={styles.subTitle}>HISTORIAL DE PELEAS</Text>
                {battleHistory.map((h, idx) => (
                  <View key={`${h.opponentName}-${idx}`} style={styles.historyRow}>
                    <Text style={styles.historyName}>{h.opponentName}</Text>
                    <View style={[styles.resultBadge, {
                      backgroundColor: h.result === 'won' ? '#22C55E12' : '#CC000010',
                      borderColor: h.result === 'won' ? '#22C55E30' : '#CC000025',
                    }]}>
                      <Text style={[styles.historyResult, { color: h.result === 'won' ? '#22C55E' : '#CC4444' }]}>
                        {h.result === 'won' ? 'GANO' : 'PERDIO'}
                      </Text>
                    </View>
                    <Text style={styles.historyDate}>{new Date(h.createdAt).toLocaleDateString()}</Text>
                  </View>
                ))}
              </View>
            )}
            {monthlyAthletes.length > 0 && (
              <View style={{ marginTop: 28 }}>
                <View style={styles.monthlyHeader}>
                  <View style={styles.monthlyLine} />
                  <Ionicons name="trophy" size={14} color="#D4AF37" />
                  <Text style={styles.monthlyLabel}>ATLETA DEL MES</Text>
                  <Ionicons name="trophy" size={14} color="#D4AF37" />
                  <View style={styles.monthlyLine} />
                </View>
                {monthlyAthletes.map((a, idx) => {
                  const isFirst = idx === 0;
                  const medalColor = idx < 3 ? ['#D4AF37', '#A8A9AD', '#CD7F32'][idx] : null;
                  return (
                    <View key={a.id} style={[styles.athleteRow, isFirst && styles.athleteFirst]}>
                      <View style={{ width: 26, alignItems: 'center' }}>
                        {medalColor ? (
                          <View style={[styles.athleteMedal, { borderColor: medalColor, backgroundColor: medalColor + '18' }]}>
                            <Text style={[styles.athleteMedalNum, { color: medalColor }]}>{idx + 1}</Text>
                          </View>
                        ) : (
                          <Text style={styles.athletePos}>{idx + 1}</Text>
                        )}
                      </View>
                      <AvatarCircle name={a.name} avatarClass={a.avatarClass} bodyStage={a.avatarBodyStage} profilePhoto={a.profilePhoto} size="small" />
                      <View style={{ flex: 1, marginLeft: 4 }}>
                        <Text style={styles.athleteName}>{a.name}</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                          {a.gold > 0 && <Text style={styles.athleteStat}>🥇{a.gold}</Text>}
                          {a.silver > 0 && <Text style={styles.athleteStat}>🥈{a.silver}</Text>}
                          {a.bronze > 0 && <Text style={styles.athleteStat}>🥉{a.bronze}</Text>}
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.athleteScore, medalColor && { color: medalColor }]}>{a.score}</Text>
                        <Text style={styles.athleteUnit}>PTS</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        }
        renderItem={({ item }) => {
          const move = CLASS_MOVES[item.avatarClass] || CLASS_MOVES.ROOKIE;
          const noBattles = battlesRemaining?.remaining === 0;
          return (
            <View style={[styles.memberRow, { borderLeftColor: move.color, borderLeftWidth: 3 }]}>
              <AvatarCircle
                name={item.name}
                avatarClass={item.avatarClass}
                bodyStage={item.avatarBodyStage}
                size="small"
                profilePhoto={item.profilePhoto}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={[styles.moveName, { color: move.color }]}>{move.icon} {move.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <Ionicons name="flash" size={12} color="#3B82F6" />
                  <Text style={styles.memberMeta}>PWR: {item.statPower}</Text>
                </View>
              </View>
              <AnimatedPressable
                style={[styles.fightBtn, { borderColor: noBattles ? colors.border : move.color }]}
                onPress={() => !noBattles && setChallengeTarget(item)}
                haptic="medium"
                scaleDown={0.92}
                disabled={noBattles}
              >
                <Text style={[styles.fightText, { color: noBattles ? colors.textDim : move.color }]}>PELEAR</Text>
              </AnimatedPressable>
            </View>
          );
        }}
      />

      <MovePickerModal
        visible={!!challengeTarget}
        target={challengeTarget}
        me={user}
        fighting={fighting}
        onCancel={() => setChallengeTarget(null)}
        onFight={onFight}
      />

      <MovePickerModal
        visible={!!respondTarget}
        target={respondTarget}
        me={user}
        fighting={responding}
        onCancel={() => setRespondTarget(null)}
        onFight={onRespond}
      />

      {battleState.battleId ? (
        <VideoBattleModal
          open={battleState.open}
          battleId={battleState.battleId}
          result={battleState.result}
          me={user}
          target={battleState.target}
          onClose={async () => {
            setBattleState({ open: false, result: null, target: null, battleId: null });
            await refreshMe();
            await load();
          }}
        />
      ) : (
        <BattleModal
          open={battleState.open}
          result={battleState.result}
          me={user}
          target={battleState.target}
          onClose={async () => {
            setBattleState({ open: false, result: null, target: null, battleId: null });
            await refreshMe();
            await load();
          }}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  title:        { color: colors.textPrimary, fontSize: 32, fontFamily: fonts.heading, letterSpacing: 2 },
  subtitle:     { color: colors.textMuted, fontSize: 13, marginBottom: 16, marginTop: 2 },
  subTitle:     { color: colors.textMuted, fontWeight: '700', fontSize: 11, marginBottom: 10, letterSpacing: 2, textTransform: 'uppercase' },
  emptyWrap:    { alignItems: 'center', marginTop: 60, gap: 10 },
  empty:        { color: colors.textMuted, fontSize: 14 },
  memberRow:    { backgroundColor: colors.cardLight, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8, overflow: 'hidden' },
  memberName:   { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  moveName:     { fontSize: 11, fontWeight: '700', marginTop: 2 },
  memberMeta:   { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  fightBtn:     { borderWidth: 1.5, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 14, backgroundColor: 'transparent' },
  fightText:    { fontWeight: '900', fontSize: 12 },
  historyRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, backgroundColor: colors.cardLight, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: colors.border },
  historyName:  { color: colors.textPrimary, flex: 1, fontSize: 13 },
  resultBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderRadius: 6 },
  historyResult:{ fontWeight: '800', fontSize: 12 },
  historyDate:  { color: colors.textMuted, fontSize: 11, marginLeft: 8 },
  remainingBadge: { marginLeft: 'auto', backgroundColor: colors.accent + '10', borderWidth: 1, borderColor: colors.accent + '25', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  remainingText:  { color: colors.accent, fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  // Monthly athlete styles
  monthlyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  monthlyLine: { flex: 1, height: 1, backgroundColor: colors.border },
  monthlyLabel: { color: '#D4AF37', fontWeight: '900', fontSize: 10, letterSpacing: 1.5 },
  athleteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.cardLight, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: 10, paddingHorizontal: 10, marginBottom: 6,
  },
  athleteFirst: { borderColor: '#D4AF37', borderWidth: 1.5 },
  athleteMedal: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  athleteMedalNum: { fontWeight: '900', fontSize: 11 },
  athletePos: { color: colors.textMuted, fontWeight: '800', fontSize: 13 },
  athleteName: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  athleteStat: { fontSize: 11 },
  athleteScore: { color: colors.primary, fontWeight: '900', fontSize: 15 },
  athleteUnit: { color: colors.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
});

const b = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: colors.background },
  flash:        { ...StyleSheet.absoluteFillObject, zIndex: 99 },
  screen:       { flex: 1, paddingHorizontal: 16, justifyContent: 'center', paddingVertical: 16 },
  hpSection:    { gap: 8, marginBottom: 12 },
  hpRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hpName:       { width: 64, fontWeight: '900', fontSize: 11 },
  arena:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'visible', marginVertical: 16 },
  fighterSlot:  { flex: 1, alignItems: 'center', position: 'relative', overflow: 'visible' },
  auraGlow:     { position: 'absolute', width: 120, height: 120, borderRadius: 60, alignSelf: 'center', zIndex: 0 },
  fighterName:  { fontWeight: '900', fontSize: 11, textAlign: 'center', marginTop: 4 },
  supps:        { fontSize: 12, letterSpacing: 2, marginTop: 2 },
  crownBadge:   { fontSize: 20, marginTop: 4 },
  centerCol:    { width: 90, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  roundText:    { color: colors.textPrimary, fontWeight: '900', fontSize: 13, textAlign: 'center', letterSpacing: 1, textShadowColor: colors.textMuted, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
  impactEmoji:  { fontSize: 44, position: 'absolute' },
  moveNameWrap: { alignItems: 'center', height: 36, justifyContent: 'center' },
  moveNameText: { color: colors.textPrimary, fontWeight: '900', fontSize: 14, letterSpacing: 1, textAlign: 'center', textShadowColor: colors.textMuted, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
  resultBox:    { alignItems: 'center', gap: 12, paddingTop: 10 },
  resultTitle:  { fontSize: 32, fontWeight: '900', letterSpacing: 4, textShadowRadius: 20, textShadowOffset: { width: 0, height: 0 } },
  rewardsRow:   { flexDirection: 'row', gap: 12 },
  rewardPill:   { backgroundColor: colors.cardLight, borderWidth: 1, borderColor: colors.gold + '30', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, alignItems: 'center', gap: 2 },
  rewardVal:    { fontWeight: '900', fontSize: 20 },
  rewardLbl:    { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  motto:        { color: colors.textMuted, fontSize: 13 },
  closeBtn:     { borderWidth: 1.5, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 44 },
  closeBtnText: { fontFamily: fonts.heading, letterSpacing: 3, fontSize: 18 },
});
