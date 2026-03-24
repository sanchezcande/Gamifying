import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../components/AnimatedPressable';
import { colors } from '../theme/theme';

let Haptics;
try { Haptics = require('expo-haptics'); } catch {}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    iconName: 'barbell',
    title: 'BECOME YOUR\nAVATAR',
    subtitle: 'Create your fitness character.\nTrain hard, watch it evolve.',
    gradient: ['#120008', '#0A0A0A', '#0A0000'],
    accentColor: '#CC0000',
  },
  {
    id: '2',
    iconName: 'flash',
    title: 'BATTLE YOUR\nGYM MATES',
    subtitle: 'Challenge anyone in your gym.\nWin coins, earn glory.',
    gradient: ['#080015', '#0A0A0A', '#000810'],
    accentColor: '#3B82F6',
  },
  {
    id: '3',
    iconName: 'trophy',
    title: 'CLIMB THE\nRANKS',
    subtitle: 'Monthly leaderboards.\nFrom Rookie to Warrior.',
    gradient: ['#0D0A00', '#0A0A0A', '#0A0800'],
    accentColor: '#D4AF37',
  },
  {
    id: '4',
    iconName: 'flame',
    title: 'READY TO\nGAMIFY?',
    subtitle: "Your gym. Your rules.\nLet's go.",
    gradient: ['#1A0000', '#0A0A0A', '#120000'],
    accentColor: '#CC0000',
  },
];

function SlideItem({ item, index, scrollX }) {
  const inputRange = [
    (index - 1) * SCREEN_W,
    index * SCREEN_W,
    (index + 1) * SCREEN_W,
  ];

  const iconScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.5, 1, 0.5],
    extrapolate: 'clamp',
  });
  const iconOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });
  const titleY = scrollX.interpolate({
    inputRange,
    outputRange: [60, 0, -60],
    extrapolate: 'clamp',
  });
  const titleOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[slideStyles.slide, { width: SCREEN_W }]}>
      <LinearGradient colors={item.gradient} style={StyleSheet.absoluteFill} />

      {/* Decorative glow */}
      <View style={[slideStyles.glow, { backgroundColor: item.accentColor }]} />

      <Animated.View style={[slideStyles.iconWrap, { transform: [{ scale: iconScale }], opacity: iconOpacity }]}>
        <View style={[slideStyles.iconCircle, { borderColor: item.accentColor + '44', backgroundColor: item.accentColor + '11' }]}>
          <Ionicons name={item.iconName} size={48} color={item.accentColor} />
        </View>
      </Animated.View>

      <Animated.View
        style={{
          transform: [{ translateY: titleY }],
          opacity: titleOpacity,
          alignItems: 'center',
        }}
      >
        <Text style={slideStyles.title}>{item.title}</Text>
        <Text style={slideStyles.subtitle}>{item.subtitle}</Text>
      </Animated.View>
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goNext = useCallback(() => {
    if (Haptics && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      navigation.replace('Login');
    }
  }, [currentIndex, navigation]);

  const goLogin = useCallback(() => {
    navigation.replace('Login');
  }, [navigation]);

  const skip = useCallback(() => {
    navigation.replace('Register');
  }, [navigation]);

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => (
          <SlideItem item={item} index={index} scrollX={scrollX} />
        )}
      />

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const isActive = i === currentIndex;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: isActive ? 28 : 8,
                    opacity: isActive ? 1 : 0.3,
                    backgroundColor: SLIDES[currentIndex]?.accentColor || colors.primary,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Buttons */}
        <AnimatedPressable style={styles.nextBtn} onPress={goNext} haptic="medium">
          <LinearGradient
            colors={isLast ? ['#E00', '#900'] : ['#333', '#222']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextBtnGrad}
          >
            <Text style={styles.nextBtnText}>
              {isLast ? "LET'S GO" : 'NEXT'}
            </Text>
          </LinearGradient>
        </AnimatedPressable>

        <View style={styles.bottomLinks}>
          {!isLast && (
            <AnimatedPressable onPress={skip} haptic="light">
              <Text style={styles.skipText}>Skip</Text>
            </AnimatedPressable>
          )}
          <AnimatedPressable onPress={goLogin} haptic="light">
            <Text style={styles.loginText}>Already have an account? <Text style={{ color: colors.primary, fontWeight: '800' }}>Log in</Text></Text>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const slideStyles = StyleSheet.create({
  slide: {
    height: SCREEN_H,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  glow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.08,
    top: SCREEN_H * 0.2,
  },
  iconWrap: {
    marginBottom: 32,
    alignItems: 'center',
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 44,
    marginBottom: 16,
  },
  subtitle: {
    color: '#777',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: 'rgba(10,10,10,0.85)',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  nextBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  nextBtnGrad: {
    paddingVertical: 17,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 17,
    letterSpacing: 2,
  },
  bottomLinks: {
    alignItems: 'center',
    gap: 12,
    paddingBottom: 4,
  },
  skipText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
  },
  loginText: {
    color: '#555',
    fontSize: 14,
  },
});
