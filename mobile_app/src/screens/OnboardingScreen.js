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
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../components/AnimatedPressable';
import { useI18n } from '../i18n/I18nProvider';
import { colors, fonts } from '../theme/theme';

let Haptics;
try { Haptics = require('expo-haptics'); } catch {}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const SLIDE_META = [
  { id: '1', iconName: 'barbell',  titleKey: 'onb1Title', subKey: 'onb1Sub', accentColor: colors.primary },
  { id: '2', iconName: 'flash',    titleKey: 'onb2Title', subKey: 'onb2Sub', accentColor: '#3B82F6' },
  { id: '3', iconName: 'trophy',   titleKey: 'onb3Title', subKey: 'onb3Sub', accentColor: '#D4AF37' },
  { id: '4', iconName: 'flame',    titleKey: 'onb4Title', subKey: 'onb4Sub', accentColor: '#CC0000' },
];

function SlideItem({ item, index, scrollX, t }) {
  const inputRange = [
    (index - 1) * SCREEN_W,
    index * SCREEN_W,
    (index + 1) * SCREEN_W,
  ];

  const iconScale = scrollX.interpolate({ inputRange, outputRange: [0.5, 1, 0.5], extrapolate: 'clamp' });
  const iconOpacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });
  const titleY = scrollX.interpolate({ inputRange, outputRange: [50, 0, -50], extrapolate: 'clamp' });
  const titleOpacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });
  const bgNumberOpacity = scrollX.interpolate({ inputRange, outputRange: [0, 0.04, 0], extrapolate: 'clamp' });
  const lineScaleX = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });
  const iconRotate = scrollX.interpolate({ inputRange, outputRange: ['-8deg', '0deg', '8deg'], extrapolate: 'clamp' });

  const stepNum = String(index + 1).padStart(2, '0');

  return (
    <View style={[slideStyles.slide, { width: SCREEN_W }]}>
      {/* Giant background number */}
      <Animated.Text style={[slideStyles.bgNumber, { opacity: bgNumberOpacity }]}>
        {stepNum}
      </Animated.Text>

      {/* Step indicator */}
      <Animated.View style={[slideStyles.stepBadge, { opacity: titleOpacity, backgroundColor: item.accentColor }]}>
        <Text style={slideStyles.stepBadgeText}>{stepNum}</Text>
      </Animated.View>

      {/* Icon block */}
      <Animated.View style={[slideStyles.iconWrap, { transform: [{ scale: iconScale }, { rotate: iconRotate }], opacity: iconOpacity }]}>
        {/* Outer ring */}
        <View style={[slideStyles.outerRing, { borderColor: item.accentColor + '20' }]} />
        {/* Main icon box */}
        <View style={[slideStyles.iconBox, { backgroundColor: item.accentColor }]}>
          <Ionicons name={item.iconName} size={52} color={colors.background} />
        </View>
        {/* Corner accents */}
        <View style={[slideStyles.cornerTL, { backgroundColor: item.accentColor }]} />
        <View style={[slideStyles.cornerBR, { backgroundColor: item.accentColor }]} />
      </Animated.View>

      {/* Decorative line */}
      <Animated.View style={[slideStyles.decoLine, { backgroundColor: item.accentColor, transform: [{ scaleX: lineScaleX }] }]} />

      {/* Text content */}
      <Animated.View style={{ transform: [{ translateY: titleY }], opacity: titleOpacity, alignItems: 'center' }}>
        <Text style={slideStyles.title}>{t(item.titleKey)}</Text>
        <Text style={slideStyles.subtitle}>{t(item.subKey)}</Text>
      </Animated.View>
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index ?? 0);
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goNext = useCallback(() => {
    if (Haptics && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDE_META.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      navigation.replace('Login');
    }
  }, [currentIndex, navigation]);

  const goLogin = useCallback(() => navigation.replace('Login'), [navigation]);
  const skip = useCallback(() => navigation.replace('Register'), [navigation]);

  const isLast = currentIndex === SLIDE_META.length - 1;
  const currentAccent = SLIDE_META[currentIndex].accentColor;

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDE_META}
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
          <SlideItem item={item} index={index} scrollX={scrollX} t={t} />
        )}
      />

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {SLIDE_META.map((slide, i) => {
            const isActive = i === currentIndex;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: isActive ? 32 : 8,
                    height: isActive ? 4 : 4,
                    backgroundColor: isActive ? currentAccent : colors.border,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Next / Let's Go button */}
        <AnimatedPressable style={styles.nextBtn} onPress={goNext} haptic="medium">
          <View style={[styles.nextBtnInner, { borderColor: currentAccent, backgroundColor: isLast ? currentAccent : 'transparent' }]}>
            <Text style={[styles.nextBtnText, { color: isLast ? colors.background : currentAccent }]}>
              {isLast ? t('letsGo') : t('next')}
            </Text>
            {!isLast && (
              <Ionicons name="arrow-forward" size={18} color={currentAccent} style={{ marginLeft: 8 }} />
            )}
          </View>
        </AnimatedPressable>

        {/* Bottom links */}
        <View style={styles.bottomLinks}>
          {!isLast && (
            <AnimatedPressable onPress={skip} haptic="light">
              <Text style={styles.skipText}>{t('skip')}</Text>
            </AnimatedPressable>
          )}
          <AnimatedPressable onPress={goLogin} haptic="light">
            <Text style={styles.loginText}>{t('alreadyAccount')} <Text style={{ color: currentAccent, fontWeight: '800' }}>{t('logIn')}</Text></Text>
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
    backgroundColor: colors.background,
  },
  bgNumber: {
    position: 'absolute',
    top: SCREEN_H * 0.12,
    fontSize: 280,
    fontFamily: fonts.heading,
    color: colors.primary,
    letterSpacing: -10,
  },
  stepBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 28,
  },
  stepBadgeText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
  },
  iconWrap: {
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
  },
  outerRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  iconBox: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: 3,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 3,
  },
  decoLine: {
    width: 60,
    height: 2,
    marginBottom: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 46,
    fontFamily: fonts.heading,
    textAlign: 'center',
    letterSpacing: 2,
    lineHeight: 50,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
    paddingHorizontal: 16,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: 'rgba(240,235,224,0.97)',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    borderRadius: 2,
  },
  nextBtn: {
    overflow: 'hidden',
    marginBottom: 16,
  },
  nextBtnInner: {
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2,
  },
  nextBtnText: {
    fontFamily: fonts.heading,
    fontSize: 20,
    letterSpacing: 3,
  },
  bottomLinks: {
    alignItems: 'center',
    gap: 12,
    paddingBottom: 4,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  loginText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
