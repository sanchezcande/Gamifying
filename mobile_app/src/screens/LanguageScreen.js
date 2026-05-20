import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../components/AnimatedPressable';
import { useI18n } from '../i18n/I18nProvider';
import { colors, radius } from '../theme/theme';

const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
  { code: 'it', label: 'Italiano',  flag: '🇮🇹' },
  { code: 'ru', label: 'Русский',   flag: '🇷🇺' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
];

export default function LanguageScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { changeLang } = useI18n();

  const pick = async (code) => {
    await changeLang(code);
    navigation.replace('Splash');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      <View style={styles.list}>
        {LANGUAGES.map((l) => (
          <AnimatedPressable
            key={l.code}
            style={styles.langBtn}
            onPress={() => pick(l.code)}
            haptic="light"
            scaleDown={0.96}
          >
            <Text style={styles.langFlag}>{l.flag}</Text>
            <Text style={styles.langLabel}>{l.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </AnimatedPressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  list: {
    width: '100%',
    gap: 8,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 12,
  },
  langFlag: {
    fontSize: 26,
    width: 36,
    textAlign: 'center',
  },
  langLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
});
