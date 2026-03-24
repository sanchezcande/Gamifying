import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../providers/AuthProvider';
import { useBattleData } from '../providers/BattleProvider';
import apiService from '../services/apiService';
import AvatarCircle from '../components/AvatarCircle';
import AvatarSprite, { CLASS_GLOW, CLASS_AURA } from '../components/AvatarSprite';
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
import { colors, radius } from '../theme/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const CLASS_MOVES = {
  WARRIOR:  { name: 'WARRIOR SLAM',    icon: '🔥', color: '#CC0000', gradient: ['#3a0000', '#140000'] },
  CHAMPION: { name: 'CHAMPION STRIKE', icon: '⚡', color: '#3B82F6', gradient: ['#071630', '#030a18'] },
  FIGHTER:  { name: 'POWER PUNCH',     icon: '💥', color: '#22C55E', gradient: ['#062010', '#020d06'] },
  ROOKIE:   { name: 'WILD HIT',        icon: '👊', color: '#888888', gradient: ['#181818', '#0a0a0a'] },
};

// Special finisher moves per class
const SPECIAL_MOVES = {
  WARRIOR:  { name: 'INFERNO SLAM',    emoji: '🌋', color: '#FF2200', particles: ['🔥','💥','🔥','⚡','🔥'] },
  CHAMPION: { name: 'THUNDER STRIKE',  emoji: '⚡', color: '#3B82F6', particles: ['⚡','💙','⚡','✨','⚡'] },
  FIGHTER:  { name: 'EMERALD CRUSHER', emoji: '💚', color: '#22C55E', particles: ['💚','💥','🌿','💚','💥'] },
  ROOKIE:   { name: 'WILD SWING',      emoji: '👊', color: '#aaaaaa', particles: ['👊','💫','👊','💨','👊'] },
};

const SUPP_ICONS = {
  PROTEIN: '💪', CREATINE: '⚡', PREWORKOUT: '🚀', AURA: '🔥', STREAK_SHIELD: '🛡',
};

// ─── Challenge Modal ───────────────────────────────────────────────────────────
function ChallengeModal({ target, me, open, onCancel, onFight, fighting }) {
  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const vsScale     = useRef(new Animated.Value(1)).current;
  const vsPulseRef  = useRef(null);

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start(() => {
        vsPulseRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(vsScale, { toValue: 1.22, duration: 480, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(vsScale, { toValue: 1,    duration: 480, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        );
        vsPulseRef.current.start();
      });
    } else {
      vsPulseRef.current?.stop();
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      vsScale.setValue(1);
    }
  }, [open]);

  if (!target || !open) return null;

  const myMove    = CLASS_MOVES[me?.avatarClass]    || CLASS_MOVES.ROOKIE;
  const theirMove = CLASS_MOVES[target.avatarClass] || CLASS_MOVES.ROOKIE;

  return (
    <Modal visible={open} transparent animationType="none" statusBarTranslucent>
      <View style={c.backdrop}>
        <Animated.View style={[c.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={['#111', '#0a0a0a']} style={c.inner}>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={c.titleTop}>CHALLENGE</Text>
            </View>

            {/* Fighters preview */}
            <View style={c.fightersRow}>
              <View style={c.fighterSide}>
                <AvatarCircle
                  name={me?.name}
                  avatarClass={me?.avatarClass}
                  bodyStage={me?.avatarBodyStage}
                  size="large"
                  activeSupplements={me?.activeSupplements || []}
                  profilePhoto={me?.profilePhoto}
                />
                <Text style={c.fighterName}>{me?.name}</Text>
                <Text style={[c.moveLabel, { color: myMove.color }]}>{myMove.icon} {myMove.name}</Text>
              </View>

              <View style={c.vsCol}>
                <Animated.Text style={[c.vsText, { transform: [{ scale: vsScale }] }]}>VS</Animated.Text>
              </View>

              <View style={c.fighterSide}>
                <AvatarCircle
                  name={target.name}
                  avatarClass={target.avatarClass}
                  bodyStage={target?.avatarBodyStage}
                  size="large"
                  profilePhoto={target.profilePhoto}
                />
                <Text style={c.fighterName}>{target.name}</Text>
                <Text style={[c.moveLabel, { color: theirMove.color }]}>{theirMove.icon} {theirMove.name}</Text>
              </View>
            </View>

            <Text style={c.rewardHint}>
              Winner takes <Text style={{ color: '#d4af37' }}>50 GAINS</Text> + <Text style={{ color: colors.primary }}>30 POWER</Text>
            </Text>

            <Pressable
              style={[c.fightBtn, fighting && { opacity: 0.6 }]}
              onPress={onFight}
              disabled={fighting}
            >
              <LinearGradient colors={[myMove.color, '#8b0000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={c.fightBtnGrad}>
                <Text style={c.fightBtnText}>{fighting ? 'LOADING...' : 'FIGHT NOW'}</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={c.backBtn} onPress={onCancel} disabled={fighting}>
              <Text style={c.backBtnText}>Back down</Text>
            </Pressable>

          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

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
  track: { height: 8, backgroundColor: '#1a1a1a', borderRadius: 99, overflow: 'hidden', flex: 1 },
  fill:  { height: '100%', width: '100%', borderRadius: 99 },
});

// ─── Battle Animation Modal ────────────────────────────────────────────────────
function BattleModal({ open, result, me, target, onClose }) {
  const won       = result?.winnerId === me?.id;

  // ── Positions ──
  const myX        = useRef(new Animated.Value(-SCREEN_W)).current;
  const theirX     = useRef(new Animated.Value(SCREEN_W)).current;
  const myLunge    = useRef(new Animated.Value(0)).current;
  const theirLunge = useRef(new Animated.Value(0)).current;

  // ── Auras / charge ──
  const myChargeScale      = useRef(new Animated.Value(1)).current;
  const theirChargeScale   = useRef(new Animated.Value(1)).current;
  const myChargeOpacity    = useRef(new Animated.Value(0)).current;
  const theirChargeOpacity = useRef(new Animated.Value(0)).current;

  // ── Hit reactions ──
  const myHitX       = useRef(new Animated.Value(0)).current;
  const theirHitX    = useRef(new Animated.Value(0)).current;
  const myOpacity    = useRef(new Animated.Value(1)).current;
  const theirOpacity = useRef(new Animated.Value(1)).current;
  const myTilt       = useRef(new Animated.Value(0)).current;
  const theirTilt    = useRef(new Animated.Value(0)).current;

  // ── Winner bounce ──
  const winnerScale = useRef(new Animated.Value(1)).current;

  // ── HP bars ──
  const myHP    = useRef(new Animated.Value(100)).current;
  const theirHP = useRef(new Animated.Value(100)).current;

  // ── Screen effects ──
  const shakeX       = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const colorFlash   = useRef(new Animated.Value(0)).current;
  const darkOverlay  = useRef(new Animated.Value(0)).current;

  // ── Impact ──
  const impactOpacity = useRef(new Animated.Value(0)).current;
  const impactScale   = useRef(new Animated.Value(0)).current;
  const megaOpacity   = useRef(new Animated.Value(0)).current;
  const megaScale     = useRef(new Animated.Value(0)).current;

  // ── Round announcement ──
  const roundOpacity = useRef(new Animated.Value(0)).current;
  const roundScale   = useRef(new Animated.Value(1.4)).current;

  // ── Move name flash ──
  const moveNameOpacity = useRef(new Animated.Value(0)).current;
  const moveNameScale   = useRef(new Animated.Value(0.6)).current;

  // ── Result ──
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultY       = useRef(new Animated.Value(50)).current;

  // ── UI state ──
  const [phase, setPhase]         = useState('idle');
  const [roundText, setRoundText] = useState('');
  const [moveName, setMoveName]   = useState('');
  const [showHP, setShowHP]       = useState(false);
  const [showResult, setShowResult] = useState(false);
  const timers = useRef([]);

  // ── Magic effect triggers (incrementing = fires every time, never resets to 0) ──
  const [impactKey, setImpactKey] = useState(0);  // regular hit particles
  const [megaKey,   setMegaKey]   = useState(0);  // mega final hit
  const [shockKey,  setShockKey]  = useState(0);  // shockwave rings

  // ── Magic effect visibility ──
  const [showMagicMe,    setShowMagicMe]    = useState(false);
  const [showMagicThem,  setShowMagicThem]  = useState(false);
  const [showAmbientMe,  setShowAmbientMe]  = useState(false);
  const [showAmbientThem,setShowAmbientThem]= useState(false);

  const myGlow         = CLASS_GLOW[me?.avatarClass]     || '#888';
  const theirGlow      = CLASS_GLOW[target?.avatarClass] || '#888';
  const winnerGlow     = won ? myGlow : theirGlow;
  const mySpecial      = SPECIAL_MOVES[me?.avatarClass]     || SPECIAL_MOVES.ROOKIE;
  const theirSpecial   = SPECIAL_MOVES[target?.avatarClass] || SPECIAL_MOVES.ROOKIE;
  const winnerSpecial  = won ? mySpecial : theirSpecial;
  const mySparks       = CLASS_SPARKS[me?.avatarClass]     || CLASS_SPARKS.ROOKIE;
  const theirSparks    = CLASS_SPARKS[target?.avatarClass] || CLASS_SPARKS.ROOKIE;
  const impactSparks   = [...mySparks, ...theirSparks];
  const myEmoji        = CLASS_EMOJI[me?.avatarClass]     || '✨';
  const theirEmoji     = CLASS_EMOJI[target?.avatarClass] || '✨';

  // ── Helpers ──
  const shake = (intensity = 12) => Animated.sequence([
    Animated.timing(shakeX, { toValue: -intensity, duration: 50, useNativeDriver: true }),
    Animated.timing(shakeX, { toValue:  intensity, duration: 50, useNativeDriver: true }),
    Animated.timing(shakeX, { toValue: -intensity * 0.7, duration: 40, useNativeDriver: true }),
    Animated.timing(shakeX, { toValue:  intensity * 0.7, duration: 40, useNativeDriver: true }),
    Animated.timing(shakeX, { toValue: 0, duration: 30, useNativeDriver: true }),
  ]);

  const flash = (val = 1, dur = 60) => Animated.sequence([
    Animated.timing(flashOpacity, { toValue: val, duration: dur,     useNativeDriver: true }),
    Animated.timing(flashOpacity, { toValue: 0,   duration: dur * 4, useNativeDriver: true }),
  ]);

  const showRound = (text, cb) => {
    setRoundText(text);
    roundOpacity.setValue(0); roundScale.setValue(1.5);
    Animated.parallel([
      Animated.timing(roundOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.spring(roundScale,   { toValue: 1, friction: 5,   useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(roundOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(cb);
      }, 700);
    });
  };

  const showMoveName = (name, cb) => {
    setMoveName(name);
    moveNameOpacity.setValue(0); moveNameScale.setValue(0.5);
    Animated.parallel([
      Animated.timing(moveNameOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.spring(moveNameScale,   { toValue: 1, friction: 4,   useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(moveNameOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(cb);
      }, 900);
    });
  };

  const lunge = (attacker, dir, cb, isMega = false) => {
    const lv     = attacker === 'me' ? myLunge : theirLunge;
    const offset = dir * SCREEN_W * 0.28;

    Animated.timing(lv, { toValue: offset, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      flash();
      shake(isMega ? 20 : 12);

      // Particle burst + shockwave at impact
      if (isMega) {
        setMegaKey(k => k + 1);
      } else {
        setImpactKey(k => k + 1);
      }
      setShockKey(k => k + 1);

      // impact burst emoji
      impactOpacity.setValue(0); impactScale.setValue(0);
      Animated.parallel([
        Animated.spring(impactScale,   { toValue: 1, friction: isMega ? 2 : 3, tension: 200, useNativeDriver: true }),
        Animated.timing(impactOpacity, { toValue: 1, duration: 60, useNativeDriver: true }),
      ]).start();
      setTimeout(() => Animated.timing(impactOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(), 300);

      // pull back
      setTimeout(() => Animated.spring(lv, { toValue: 0, friction: 6, useNativeDriver: true }).start(cb), 180);
    });
  };

  const hitReaction = (tgt, dir) => {
    const hitX = tgt === 'me' ? myHitX    : theirHitX;
    const opac = tgt === 'me' ? myOpacity  : theirOpacity;
    Animated.sequence([
      Animated.timing(hitX, { toValue: dir * 18, duration: 100, useNativeDriver: true }),
      Animated.timing(hitX, { toValue: 0,        duration: 100, useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(opac, { toValue: 0.3, duration: 70, useNativeDriver: true }),
      Animated.timing(opac, { toValue: 1,   duration: 70, useNativeDriver: true }),
    ]), { iterations: 3 }).start();
  };

  const chargeUp = (fighter, showMagic = true) => {
    const scale = fighter === 'me' ? myChargeScale    : theirChargeScale;
    const opac  = fighter === 'me' ? myChargeOpacity  : theirChargeOpacity;
    opac.setValue(1);

    if (showMagic) {
      if (fighter === 'me') {
        setShowMagicMe(true);
        setShowAmbientMe(true);
      } else {
        setShowMagicThem(true);
        setShowAmbientThem(true);
      }
    }

    return Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.18, duration: 300, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 300, useNativeDriver: true }),
    ]), { iterations: 4 });
  };

  const stopCharge = (fighter) => {
    (fighter === 'me' ? myChargeOpacity  : theirChargeOpacity).setValue(0);
    (fighter === 'me' ? myChargeScale    : theirChargeScale).setValue(1);
    if (fighter === 'me') {
      setShowMagicMe(false);
      setShowAmbientMe(false);
    } else {
      setShowMagicThem(false);
      setShowAmbientThem(false);
    }
  };

  const resetAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase('idle'); setRoundText(''); setMoveName('');
    setShowHP(false); setShowResult(false);
    setShowMagicMe(false); setShowMagicThem(false);
    setShowAmbientMe(false); setShowAmbientThem(false);
    [myX, myLunge, myHitX, myTilt, myChargeOpacity, myChargeScale].forEach(v => v.setValue(0));
    [theirX, theirLunge, theirHitX, theirTilt, theirChargeOpacity, theirChargeScale].forEach(v => v.setValue(0));
    myX.setValue(-SCREEN_W); theirX.setValue(SCREEN_W);
    myOpacity.setValue(1); theirOpacity.setValue(1);
    myHP.setValue(100); theirHP.setValue(100);
    myChargeScale.setValue(1); theirChargeScale.setValue(1);
    winnerScale.setValue(1);
    shakeX.setValue(0); flashOpacity.setValue(0); darkOverlay.setValue(0);
    colorFlash.setValue(0);
    impactOpacity.setValue(0); impactScale.setValue(0);
    megaOpacity.setValue(0); megaScale.setValue(0);
    roundOpacity.setValue(0); moveNameOpacity.setValue(0);
    resultOpacity.setValue(0); resultY.setValue(50);
  };

  const T = (ms, fn) => { const id = setTimeout(fn, ms); timers.current.push(id); };

  useEffect(() => {
    if (!open) { resetAll(); return; }

    const loserHP       = won ? theirHP : myHP;
    const winnerFighter = won ? 'me'    : 'them';
    const loserFighter  = won ? 'them'  : 'me';
    const winnerDir     = won ? 1 : -1;
    const loserDir      = won ? -1 : 1;

    setPhase('enter');

    // ── ENTER: slide in ─────────────────────────────────────────────────────
    Animated.parallel([
      Animated.spring(myX,    { toValue: 0, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.spring(theirX, { toValue: 0, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start();

    T(1000, () => setShowHP(true));

    // ── ROUND 1 ─────────────────────────────────────────────────────────────
    T(1600, () => showRound('ROUND 1', () => {
      setPhase('round1');
      const c = chargeUp(winnerFighter);
      c.start();
      T(900, () => {
        c.stop();
        stopCharge(winnerFighter);
        lunge(winnerFighter, winnerDir, () => {
          hitReaction(loserFighter, winnerDir * 2);
          Animated.timing(loserHP, { toValue: 65, duration: 500, useNativeDriver: true }).start();
        });
      });
    }));

    // ── ROUND 2: loser counter-attacks ──────────────────────────────────────
    T(4400, () => showRound('ROUND 2', () => {
      setPhase('round2');
      const c2 = chargeUp(loserFighter);
      c2.start();
      T(900, () => {
        c2.stop();
        stopCharge(loserFighter);
        lunge(loserFighter, loserDir, () => {
          hitReaction(winnerFighter, loserDir * 2);
          const winnerHPBar = won ? myHP : theirHP;
          Animated.timing(winnerHPBar, { toValue: 80, duration: 500, useNativeDriver: true }).start();
        });
      });
    }));

    // ── FINAL ROUND ──────────────────────────────────────────────────────────
    T(7800, () => showRound('⚡ FINAL ROUND ⚡', () => {
      setPhase('final');

      // Screen goes dark
      Animated.timing(darkOverlay, { toValue: 0.7, duration: 400, useNativeDriver: true }).start();

      // BIG charge-up: magic circle grows huge
      const cFinal = chargeUp(winnerFighter, true);
      cFinal.start();
      const chargeScale = won ? myChargeScale   : theirChargeScale;
      const chargeOpac  = won ? myChargeOpacity : theirChargeOpacity;
      chargeOpac.setValue(1);
      Animated.timing(chargeScale, { toValue: 2.4, duration: 1800, useNativeDriver: true }).start();

      // Special move name
      T(1000, () => showMoveName(`${winnerSpecial.emoji}  ${winnerSpecial.name}`, () => {}));

      // MEGA ATTACK
      T(2200, () => {
        cFinal.stop();
        stopCharge(winnerFighter);
        Animated.timing(darkOverlay, { toValue: 0, duration: 200, useNativeDriver: true }).start();

        lunge(winnerFighter, winnerDir, () => {
          // Mega impact burst emoji
          megaOpacity.setValue(0); megaScale.setValue(0);
          Animated.parallel([
            Animated.spring(megaScale,   { toValue: 1, friction: 2, tension: 150, useNativeDriver: true }),
            Animated.timing(megaOpacity, { toValue: 1, duration: 60, useNativeDriver: true }),
          ]).start();
          setTimeout(() => Animated.timing(megaOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(), 500);

          // Winner color flash
          Animated.sequence([
            Animated.timing(colorFlash, { toValue: 1, duration: 80,  useNativeDriver: true }),
            Animated.timing(colorFlash, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]).start();

          // Loser HP → 0
          Animated.timing(loserHP, { toValue: 0, duration: 600, useNativeDriver: true }).start();

          // Loser KO: fly + tilt + fade
          const loserHitX = won ? theirHitX  : myHitX;
          const loserOpac = won ? theirOpacity : myOpacity;
          const loserTilt = won ? theirTilt   : myTilt;
          Animated.parallel([
            Animated.timing(loserHitX, { toValue: winnerDir * 60, duration: 400, useNativeDriver: true }),
            Animated.timing(loserTilt, { toValue: winnerDir * 25, duration: 400, useNativeDriver: true }),
            Animated.timing(loserOpac, { toValue: 0.15, duration: 600, useNativeDriver: true }),
          ]).start();

          flash(0.9, 80);

          // Winner victory bounce
          T(700, () => {
            setPhase('victory');
            Animated.loop(Animated.sequence([
              Animated.spring(winnerScale, { toValue: 1.15, friction: 4, useNativeDriver: true }),
              Animated.spring(winnerScale, { toValue: 1,    friction: 4, useNativeDriver: true }),
            ]), { iterations: 4 }).start();
          });

          // Result reveal
          T(1600, () => {
            setShowResult(true);
            Animated.parallel([
              Animated.timing(resultOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
              Animated.spring(resultY,       { toValue: 0, friction: 6,   useNativeDriver: true }),
            ]).start();
          });
        }, true /* isMega */);
      });
    }));
  }, [open]);

  const myMove    = CLASS_MOVES[me?.avatarClass]     || CLASS_MOVES.ROOKIE;
  const theirMove = CLASS_MOVES[target?.avatarClass] || CLASS_MOVES.ROOKIE;
  const mySupps   = (me?.activeSupplements || []).map(i => SUPP_ICONS[i.shopItem?.category]).filter(Boolean);

  return (
    <Modal visible={open} animationType="fade" transparent statusBarTranslucent>
      <View style={b.backdrop}>

        {/* ── White flash ── */}
        <Animated.View style={[b.flash, { opacity: flashOpacity, backgroundColor: '#fff' }]} pointerEvents="none" />

        {/* ── Winner color flash ── */}
        <Animated.View style={[b.flash, { opacity: colorFlash, backgroundColor: winnerGlow }]} pointerEvents="none" />

        {/* ── Final-round dark overlay ── */}
        <Animated.View style={[b.flash, { opacity: darkOverlay, backgroundColor: '#000' }]} pointerEvents="none" />

        <LinearGradient colors={['#080010', '#040008', '#000308']} style={b.screen}>

          {/* ── HP Bars ── */}
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

          {/* ── Arena ── */}
          <Animated.View style={[b.arena, { transform: [{ translateX: shakeX }] }]}>

            {/* ─ ME ─ */}
            <Animated.View style={[b.fighterSlot, {
              transform: [
                { translateX: Animated.add(Animated.add(myX, myLunge), myHitX) },
                { rotate: myTilt.interpolate({ inputRange: [-45, 45], outputRange: ['-45deg', '45deg'] }) },
                { scale: won ? winnerScale : myChargeScale },
              ],
              opacity: myOpacity,
            }]}>
              {/* Magic circle (SVG) — behind everything */}
              <MagicCircle color={myGlow} size={170} visible={showMagicMe} />

              {/* Aura glow circle */}
              <Animated.View style={[b.auraGlow, {
                backgroundColor: myGlow + '44',
                opacity: myChargeOpacity,
                transform: [{ scale: myChargeScale }],
                shadowColor: myGlow, shadowRadius: 30, shadowOpacity: 1,
              }]} />

              {/* Ambient floating particles */}
              {showAmbientMe && <AmbientParticles emoji={myEmoji} count={5} />}

              <AvatarSprite avatarClass={me?.avatarClass} bodyStage={me?.avatarBodyStage} size={95} flip={false} glowColor={myGlow} idle={phase === 'enter'} />
              <Text style={[b.fighterName, { color: myGlow }]} numberOfLines={1}>{me?.name}</Text>
              {mySupps.length > 0 && <Text style={b.supps}>{mySupps.join(' ')}</Text>}
              {phase === 'victory' && won && <Text style={b.crownBadge}>👑</Text>}
            </Animated.View>

            {/* ─ CENTER: impacts + effects ─ */}
            <View style={b.centerCol} pointerEvents="none">
              {/* Round text */}
              <Animated.Text style={[b.roundText, { opacity: roundOpacity, transform: [{ scale: roundScale }] }]}>
                {roundText}
              </Animated.Text>
              {/* Normal impact emoji */}
              <Animated.Text style={[b.impactEmoji, { opacity: impactOpacity, transform: [{ scale: impactScale }] }]}>
                💥
              </Animated.Text>
              {/* Mega impact emoji */}
              <Animated.Text style={[b.megaEmoji, { opacity: megaOpacity, transform: [{ scale: megaScale }] }]}>
                {winnerSpecial.emoji}
              </Animated.Text>
              {/* Particle explosion — normal hits */}
              <ParticleExplosion trigger={impactKey} colors={impactSparks} count={36} />
              {/* Particle explosion — mega hit (more particles, all spark colors) */}
              <ParticleExplosion trigger={megaKey}   colors={impactSparks} count={60} />
              {/* Shockwave rings */}
              <ShockWave trigger={shockKey} color={winnerGlow} />
            </View>

            {/* ─ OPPONENT ─ */}
            <Animated.View style={[b.fighterSlot, {
              transform: [
                { translateX: Animated.add(Animated.add(theirX, theirLunge), theirHitX) },
                { rotate: theirTilt.interpolate({ inputRange: [-45, 45], outputRange: ['-45deg', '45deg'] }) },
                { scale: !won ? winnerScale : theirChargeScale },
              ],
              opacity: theirOpacity,
            }]}>
              <MagicCircle color={theirGlow} size={170} visible={showMagicThem} />

              <Animated.View style={[b.auraGlow, {
                backgroundColor: theirGlow + '44',
                opacity: theirChargeOpacity,
                transform: [{ scale: theirChargeScale }],
                shadowColor: theirGlow, shadowRadius: 30, shadowOpacity: 1,
              }]} />

              {showAmbientThem && <AmbientParticles emoji={theirEmoji} count={5} />}

              <AvatarSprite avatarClass={target?.avatarClass} bodyStage={target?.avatarBodyStage} size={95} flip={true} glowColor={theirGlow} idle={phase === 'enter'} />
              <Text style={[b.fighterName, { color: theirGlow }]} numberOfLines={1}>{target?.name}</Text>
              {phase === 'victory' && !won && <Text style={b.crownBadge}>👑</Text>}
            </Animated.View>

          </Animated.View>

          {/* ── Special move name ── */}
          <Animated.View style={[b.moveNameWrap, { opacity: moveNameOpacity, transform: [{ scale: moveNameScale }] }]}>
            <Text style={[b.moveNameText, { color: winnerSpecial.color, textShadowColor: winnerSpecial.color }]}>
              {moveName}
            </Text>
          </Animated.View>

          {/* ── Result ── */}
          {showResult && (
            <Animated.View style={[b.resultBox, { opacity: resultOpacity, transform: [{ translateY: resultY }] }]}>
              <Text style={[b.resultTitle, { color: won ? '#fff' : '#555', textShadowColor: won ? winnerGlow : 'transparent' }]}>
                {won ? 'VICTORY' : 'DEFEATED'}
              </Text>
              {won ? (
                <View style={b.rewardsRow}>
                  <View style={b.rewardPill}>
                    <Text style={[b.rewardVal, { color: '#D4AF37' }]}>+{result?.gcEarned || 0}</Text>
                    <Text style={b.rewardLbl}>GAINS</Text>
                  </View>
                  <View style={[b.rewardPill, { borderColor: colors.primary + '44' }]}>
                    <Text style={[b.rewardVal, { color: colors.primary }]}>+{result?.xpEarned || 0}</Text>
                    <Text style={b.rewardLbl}>POWER</Text>
                  </View>
                </View>
              ) : (
                <Text style={b.motto}>Keep training. Come back stronger.</Text>
              )}
              <Pressable
                style={[b.closeBtn, { backgroundColor: won ? colors.primary : '#111', borderColor: won ? colors.primary : '#333' }]}
                onPress={onClose}
              >
                <Text style={b.closeBtnText}>{won ? 'CLAIM VICTORY' : 'WALK AWAY'}</Text>
              </Pressable>
            </Animated.View>
          )}

        </LinearGradient>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BattleScreen() {
  const { user, refreshMe } = useAuth();
  const { battleHistory, loadHistory, challenge } = useBattleData();
  const [members, setMembers]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [challengeTarget, setChallengeTarget] = useState(null);
  const [fighting, setFighting]             = useState(false);
  const [battleState, setBattleState]       = useState({ open: false, result: null, target: null });
  const [battlesRemaining, setBattlesRemaining] = useState(null);

  const load = async () => {
    if (!user?.gymId || !user?.id) return;
    setLoading(true);
    try {
      const [membersRes, , remainingRes] = await Promise.all([
        apiService.getGymMembers(user.gymId),
        loadHistory(user.id),
        apiService.getBattlesRemaining(),
      ]);
      setMembers((membersRes.data || []).filter(m => m.id && m.id !== user.id));
      setBattlesRemaining(remainingRes.data);
    } catch (e) {
      Alert.alert('Battle', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const onFight = async () => {
    if (!challengeTarget) return;
    try {
      setFighting(true);
      const result = await challenge(challengeTarget.id);
      setChallengeTarget(null);
      setBattleState({ open: true, result, target: challengeTarget });
    } catch (e) {
      Alert.alert('Battle', e.message);
    } finally {
      setFighting(false);
    }
  };

  const insets = useSafeAreaInsets();

  if (loading) return <LoadingScreen />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <Ionicons name="flash" size={24} color="#fff" />
        <Text style={styles.title}>BATTLE</Text>
        {battlesRemaining != null && (
          <View style={styles.remainingBadge}>
            <Text style={[styles.remainingText, battlesRemaining.remaining === 0 && { color: '#555' }]}>
              {battlesRemaining.remaining}/{battlesRemaining.limit}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.subtitle}>
        {battlesRemaining?.remaining === 0 ? 'No battles left this week' : 'Challenge a gym member'}
      </Text>

      <FlatList
        data={members}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="shield-outline" size={40} color="#333" />
            <Text style={styles.empty}>No opponents in your gym yet.</Text>
          </View>
        }
        ListFooterComponent={
          battleHistory.length > 0 ? (
            <View style={{ marginTop: 24 }}>
              <Text style={styles.subTitle}>BATTLE HISTORY</Text>
              {battleHistory.map((h, idx) => (
                <View key={`${h.opponentName}-${idx}`} style={styles.historyRow}>
                  <Text style={styles.historyName}>{h.opponentName}</Text>
                  <View style={[styles.resultBadge, {
                    backgroundColor:  h.result === 'won' ? '#0e3320' : '#1a0000',
                    borderColor:      h.result === 'won' ? '#22C55E33' : '#CC000033',
                  }]}>
                    <Text style={[styles.historyResult, { color: h.result === 'won' ? '#22C55E' : '#CC4444' }]}>
                      {h.result === 'won' ? 'WON' : 'LOST'}
                    </Text>
                  </View>
                  <Text style={styles.historyDate}>{new Date(h.createdAt).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>
          ) : null
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Ionicons name="barbell" size={11} color="#FF6B35" />
                    <Text style={styles.memberMeta}>{item.statMuscle}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Ionicons name="flash" size={11} color="#3B82F6" />
                    <Text style={styles.memberMeta}>{item.statPower}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Ionicons name="shield" size={11} color="#22C55E" />
                    <Text style={styles.memberMeta}>{item.statEndurance}</Text>
                  </View>
                </View>
              </View>
              <AnimatedPressable
                style={[styles.fightBtn, { borderColor: noBattles ? '#222' : move.color }]}
                onPress={() => !noBattles && setChallengeTarget(item)}
                haptic="medium"
                scaleDown={0.92}
                disabled={noBattles}
              >
                <Text style={[styles.fightText, { color: noBattles ? '#333' : move.color }]}>FIGHT</Text>
              </AnimatedPressable>
            </View>
          );
        }}
      />

      <ChallengeModal
        open={!!challengeTarget}
        target={challengeTarget}
        me={user}
        fighting={fighting}
        onCancel={() => setChallengeTarget(null)}
        onFight={onFight}
      />

      <BattleModal
        open={battleState.open}
        result={battleState.result}
        me={user}
        target={battleState.target}
        onClose={async () => {
          setBattleState({ open: false, result: null, target: null });
          await refreshMe();
          await load();
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background, paddingHorizontal: 14 },
  title:        { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  subtitle:     { color: '#444', fontSize: 13, marginBottom: 16, marginTop: 2 },
  subTitle:     { color: '#444', fontWeight: '800', fontSize: 11, marginBottom: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
  emptyWrap:    { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyIcon:    { fontSize: 40 },
  empty:        { color: '#444', fontSize: 14 },
  memberRow:    { backgroundColor: '#111', borderWidth: 1, borderColor: '#1E1E1E', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 8, overflow: 'hidden' },
  memberName:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  moveName:     { fontSize: 11, fontWeight: '700', marginTop: 2 },
  memberMeta:   { color: '#555', fontSize: 11, marginTop: 3 },
  fightBtn:     { borderWidth: 1.5, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14, backgroundColor: 'transparent' },
  fightText:    { fontWeight: '900', fontSize: 12 },
  historyRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, backgroundColor: '#111', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1E1E1E' },
  historyName:  { color: '#fff', flex: 1, fontSize: 13 },
  resultBadge:  { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  historyResult:{ fontWeight: '800', fontSize: 12 },
  historyDate:  { color: '#444', fontSize: 11, marginLeft: 8 },
  remainingBadge: { marginLeft: 'auto', backgroundColor: '#1a0000', borderRadius: 8, borderWidth: 1, borderColor: colors.primary + '33', paddingHorizontal: 10, paddingVertical: 4 },
  remainingText:  { color: colors.primary, fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
});

const c = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card:        { width: '100%', borderRadius: 18, overflow: 'hidden' },
  inner:       { padding: 24, alignItems: 'center' },
  titleTop:    { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 4 },
  fightersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  fighterSide: { flex: 1, alignItems: 'center', gap: 6 },
  vsCol:       { width: 40, alignItems: 'center' },
  vsText:      { color: colors.primary, fontSize: 26, fontWeight: '900', textShadowColor: colors.primary, textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } },
  fighterName: { color: '#fff', fontWeight: '800', fontSize: 12, textAlign: 'center' },
  moveLabel:   { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  rewardHint:  { color: '#777', fontSize: 12, marginBottom: 22 },
  fightBtn:    { width: '100%', borderRadius: radius.button, overflow: 'hidden', marginBottom: 10 },
  fightBtnGrad:{ paddingVertical: 15, alignItems: 'center' },
  fightBtnText:{ color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 2 },
  backBtn:     { paddingVertical: 10 },
  backBtnText: { color: '#555', fontWeight: '600', fontSize: 13 },
});

const b = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: '#000' },
  flash:        { ...StyleSheet.absoluteFillObject, zIndex: 99 },
  screen:       { flex: 1, paddingHorizontal: 16, justifyContent: 'space-evenly', paddingVertical: 24 },
  hpSection:    { gap: 8, marginBottom: 4 },
  hpRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hpName:       { width: 64, fontWeight: '900', fontSize: 11 },
  arena:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', minHeight: 210, position: 'relative' },
  fighterSlot:  { flex: 1, alignItems: 'center', position: 'relative' },
  auraGlow:     { position: 'absolute', width: 140, height: 140, borderRadius: 70, top: 0, zIndex: 0 },
  fighterName:  { fontWeight: '900', fontSize: 11, textAlign: 'center', marginTop: 4 },
  supps:        { fontSize: 12, letterSpacing: 2, marginTop: 2 },
  crownBadge:   { fontSize: 20, marginTop: 4 },
  centerCol:    { width: 90, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  roundText:    { color: '#fff', fontWeight: '900', fontSize: 13, textAlign: 'center', letterSpacing: 1, textShadowColor: '#fff', textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } },
  impactEmoji:  { fontSize: 44, position: 'absolute' },
  megaEmoji:    { fontSize: 64, position: 'absolute', textShadowColor: '#fff', textShadowRadius: 20, textShadowOffset: { width: 0, height: 0 } },
  moveNameWrap: { alignItems: 'center', minHeight: 36, justifyContent: 'center' },
  moveNameText: { fontWeight: '900', fontSize: 18, letterSpacing: 2, textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } },
  resultBox:    { alignItems: 'center', gap: 12, paddingTop: 10 },
  resultTitle:  { fontSize: 32, fontWeight: '900', letterSpacing: 4, textShadowRadius: 20, textShadowOffset: { width: 0, height: 0 } },
  rewardsRow:   { flexDirection: 'row', gap: 12 },
  rewardPill:   { backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#D4AF3744', paddingHorizontal: 18, paddingVertical: 10, alignItems: 'center', gap: 2 },
  rewardVal:    { fontWeight: '900', fontSize: 20 },
  rewardLbl:    { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  motto:        { color: '#444', fontSize: 13 },
  closeBtn:     { borderWidth: 1, borderRadius: radius.button, paddingVertical: 14, paddingHorizontal: 44 },
  closeBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 2, fontSize: 14 },
});
