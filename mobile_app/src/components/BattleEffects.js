import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline } from 'react-native-svg';

const AnimatedG      = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Class configs ─────────────────────────────────────────────────────────────
export const CLASS_SPARKS = {
  WARRIOR:  ['#FF4500', '#FF6600', '#FFD700', '#FF2200', '#FF8C00', '#FFA500'],
  CHAMPION: ['#3B82F6', '#60A5FA', '#A855F7', '#C084FC', '#93C5FD', '#E879F9'],
  FIGHTER:  ['#22C55E', '#4ADE80', '#86EFAC', '#FBBF24', '#FCD34D', '#A3E635'],
  ROOKIE:   ['#9CA3AF', '#D1D5DB', '#E5E7EB', '#6B7280', '#ffffff',  '#CBD5E1'],
};

export const CLASS_EMOJI = {
  WARRIOR:  '🔥',
  CHAMPION: '⚡',
  FIGHTER:  '💪',
  ROOKIE:   '💨',
};

// ─── Single Spark Particle ────────────────────────────────────────────────────
function Spark({ color, angle, speed, size, delay }) {
  const prog = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(prog, {
        toValue: 1,
        duration: 550 + speed * 450,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dist    = 55 + speed * 120;
  const gravity = 22 + speed * 30;

  const tx      = prog.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * dist] });
  const ty      = prog.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * dist + gravity] });
  const opacity = prog.interpolate({ inputRange: [0, 0.12, 0.65, 1], outputRange: [0, 1, 0.85, 0] });
  const scale   = prog.interpolate({ inputRange: [0, 0.08, 0.5,  1], outputRange: [0, 1.8, 1.1, 0.2] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        shadowColor: color,
        shadowRadius: 8, shadowOpacity: 1,
        shadowOffset: { width: 0, height: 0 },
        transform: [{ translateX: tx }, { translateY: ty }, { scale }],
        opacity,
      }}
    />
  );
}

// ─── Particle Explosion ────────────────────────────────────────────────────────
export function ParticleExplosion({ trigger, colors, count = 38 }) {
  const [particles, setParticles] = useState([]);
  const keyRef  = useRef(0);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    keyRef.current += 1;
    const k    = keyRef.current;
    const cols = colors?.length ? colors : ['#FFD700', '#FF4500', '#FF69B4', '#00CED1', '#ADFF2F'];

    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id:    `${k}-${i}`,
        angle: (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
        speed: 0.25 + Math.random() * 0.75,
        color: cols[Math.floor(Math.random() * cols.length)],
        size:  5 + Math.random() * 11,
        delay: Math.floor(Math.random() * 110),
      }))
    );
    setTimeout(() => setParticles([]), 1600);
  }, [trigger]);

  if (!particles.length) return null;
  return (
    <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
      {particles.map(p => <Spark key={p.id} {...p} />)}
    </View>
  );
}

// ─── Expanding Impact Ring ─────────────────────────────────────────────────────
function ImpactRing({ color, delay, maxSize, strokeWidth }) {
  const prog = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(prog, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const scale   = prog.interpolate({ inputRange: [0, 1], outputRange: [0.04, 1] });
  const opacity = prog.interpolate({ inputRange: [0, 0.18, 1], outputRange: [1, 0.85, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: maxSize, height: maxSize,
        borderRadius: maxSize / 2,
        borderWidth: strokeWidth,
        borderColor: color,
        shadowColor: color, shadowRadius: 12, shadowOpacity: 1,
        shadowOffset: { width: 0, height: 0 },
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

export function ShockWave({ trigger, color = '#FFD700' }) {
  const [key,  setKey]  = useState(0);
  const [show, setShow] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setKey(k => k + 1);
    setShow(true);
    setTimeout(() => setShow(false), 1000);
  }, [trigger]);

  if (!show) return null;
  return (
    <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
      {[0, 1, 2, 3].map(i => (
        <ImpactRing
          key={`${key}-${i}`}
          color={color}
          delay={i * 75}
          maxSize={80 + i * 90}
          strokeWidth={Math.max(1, 3.5 - i * 0.7)}
        />
      ))}
    </View>
  );
}

// ─── Rotating Magic Circle (SVG) ──────────────────────────────────────────────
export function MagicCircle({ color, size = 180, visible }) {
  const rot1     = useRef(new Animated.Value(0)).current;
  const rot2     = useRef(new Animated.Value(0)).current;
  const glowR    = useRef(new Animated.Value(14)).current;
  const opacity  = useRef(new Animated.Value(0)).current;
  const loopsRef = useRef([]);

  useEffect(() => {
    if (!visible) {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        loopsRef.current.forEach(l => l?.stop());
        rot1.setValue(0); rot2.setValue(0);
      });
      return;
    }

    Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    const l1 = Animated.loop(Animated.timing(rot1, { toValue: 360,  duration: 2400, easing: Easing.linear, useNativeDriver: false }));
    const l2 = Animated.loop(Animated.timing(rot2, { toValue: -360, duration: 1700, easing: Easing.linear, useNativeDriver: false }));
    const l3 = Animated.loop(Animated.sequence([
      Animated.timing(glowR, { toValue: 24, duration: 500, useNativeDriver: false }),
      Animated.timing(glowR, { toValue: 12, duration: 500, useNativeDriver: false }),
    ]));

    loopsRef.current = [l1, l2, l3];
    l1.start(); l2.start(); l3.start();
    return () => loopsRef.current.forEach(l => l?.stop());
  }, [visible]);

  const cx = size / 2;
  const cy = size / 2;
  const R1 = size * 0.44;
  const R2 = size * 0.31;

  // Tick marks around outer ring
  const ticks = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return {
      x1: cx + Math.cos(a) * (R1 - 7), y1: cy + Math.sin(a) * (R1 - 7),
      x2: cx + Math.cos(a) * (R1 + 5), y2: cy + Math.sin(a) * (R1 + 5),
    };
  });

  // Equilateral triangle inscribed in R2
  const triPts = [0, 1, 2].map(i => {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
    return `${cx + Math.cos(a) * R2},${cy + Math.sin(a) * R2}`;
  }).join(' ');

  return (
    <Animated.View
      style={{ position: 'absolute', width: size, height: size, opacity }}
      pointerEvents="none"
    >
      <Svg width={size} height={size}>
        {/* Outer dashed ring + tick marks — rotates CW */}
        <AnimatedG rotation={rot1} origin={`${cx},${cy}`}>
          <Circle
            cx={cx} cy={cy} r={R1}
            stroke={color} strokeWidth={1.5} fill="none"
            strokeOpacity={0.65} strokeDasharray="10 6"
          />
          {ticks.map((t, i) => (
            <Line key={i}
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={color} strokeWidth={1.5} strokeOpacity={0.5}
            />
          ))}
        </AnimatedG>

        {/* Inner dashed ring + triangle — rotates CCW */}
        <AnimatedG rotation={rot2} origin={`${cx},${cy}`}>
          <Circle
            cx={cx} cy={cy} r={R2}
            stroke={color} strokeWidth={1} fill="none"
            strokeOpacity={0.5} strokeDasharray="5 9"
          />
          <Polyline
            points={triPts}
            stroke={color} strokeWidth={1.3} fill="none" strokeOpacity={0.75}
            strokeLinejoin="round"
          />
        </AnimatedG>

        {/* Pulsing center glow */}
        <AnimatedCircle cx={cx} cy={cy} r={glowR} fill={color} fillOpacity={0.18} />
        <Circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.9} />
      </Svg>
    </Animated.View>
  );
}

// ─── Ambient Floating Emoji Particles ─────────────────────────────────────────
function EmojiParticle({ emoji, offsetX, delay }) {
  const y       = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const drift   = useRef(offsetX + Math.random() * 28 - 14).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y,       { toValue: -88, duration: 1500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.9, duration: 260,  useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0,   duration: 1240, useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(y, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        fontSize: 15,
        transform: [{ translateX: drift }, { translateY: y }],
        opacity,
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

export function AmbientParticles({ emoji = '✨', count = 6 }) {
  const pts = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      offsetX: (i - (count - 1) / 2) * 20,
      delay:   i * 290,
    }))
  ).current;

  return (
    <View
      style={{ position: 'absolute', bottom: 6, width: 130, height: 100, alignItems: 'center' }}
      pointerEvents="none"
    >
      {pts.map(p => <EmojiParticle key={p.id} emoji={emoji} offsetX={p.offsetX} delay={p.delay} />)}
    </View>
  );
}

// ─── Full-screen Color Flash ───────────────────────────────────────────────────
export function ColorFlash({ trigger, color = '#fff' }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    opacity.setValue(0.88);
    Animated.timing(opacity, {
      toValue: 0, duration: 480, easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start();
  }, [trigger]);

  return (
    <Animated.View
      style={{ ...StyleSheet.absoluteFillObject, backgroundColor: color, opacity, zIndex: 100 }}
      pointerEvents="none"
    />
  );
}
