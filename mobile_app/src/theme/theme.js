export const colors = {
  background: '#0A0A0A',
  primary: '#CC0000',
  surface: '#161616',
  surfaceElevated: '#1A1A1A',
  card: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#555555',
  textDim: '#444444',
  border: '#2A2A2A',
  borderSubtle: '#1E1E1E',
  borderLight: '#333333',
  success: '#22C55E',
  warning: '#D97800',
  danger: '#CC0000',
  gold: '#D4AF37',
  accent: '#C9FF47',
  electric: '#4A90FF',
  muscle: '#FF6B35',
  power: '#3B82F6',
  endurance: '#22C55E',
  purple: '#A855F7',
  indigo: '#6366F1',
  pink: '#EC4899',
  amber: '#F59E0B',
};

export const classColors = {
  ROOKIE:   { main: '#888888', bg: '#1a1a1a', glow: '#88888844' },
  FIGHTER:  { main: '#22C55E', bg: '#0D2E1A', glow: '#22C55E44' },
  CHAMPION: { main: '#3B82F6', bg: '#0D1A2E', glow: '#3B82F644' },
  WARRIOR:  { main: '#CC0000', bg: '#2b1111', glow: '#CC000044' },
};

export const gradients = {
  primary:  ['#E00', '#900'],
  dark:     ['#0a0a0a', '#120000'],
  hero:     ['#180003', '#0A0A0A'],
  midnight: ['#080010', '#040008', '#000308'],
  gold:     ['#1A1400', '#111'],
  fire:     ['#FF6B35', '#CC0000'],
  energy:   ['#C9FF47', '#22C55E'],
  surface:  ['#161616', '#0A0A0A'],
};

export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
};

export const radius = {
  xs: 6,
  sm: 8,
  button: 10,
  card: 12,
  cardLarge: 16,
  xl: 20,
  full: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowRadius: 8,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000',
    shadowRadius: 16,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowRadius: 12,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
  }),
};

export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { friction: 6, tension: 100 },
  springBouncy: { friction: 4, tension: 200 },
};

export const typography = {
  titleHuge: { fontSize: 72, fontWeight: '800', color: colors.textPrimary },
  title: { fontSize: 32, fontWeight: '700', color: colors.textPrimary },
  titleSm: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400', color: colors.textPrimary },
  bodyMuted: { fontSize: 14, fontWeight: '400', color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', color: colors.textMuted },
};

export const appTheme = {
  dark: true,
  colors,
  spacing,
  radius,
  typography,
  shadows,
  animation,
};
