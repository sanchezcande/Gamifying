// Gamifying Design System — Brutalist Gym Aesthetic
// Inspired by the pitch deck: cream + black, condensed bold, sharp edges

export const colors = {
  // Core palette
  background: '#F0EBE0',       // Cream/beige (deck dominant)
  backgroundDark: '#1A1A1A',   // Near-black sections
  primary: '#1A1A1A',          // Black as primary action
  primaryOnDark: '#F0EBE0',    // Cream on dark surfaces

  // Surfaces
  surface: '#1A1A1A',
  surfaceElevated: '#222222',
  card: '#1A1A1A',
  cardLight: '#E8E3D8',        // Slightly darker cream for subtle cards

  // Text on cream backgrounds
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6560',
  textMuted: '#9B9590',
  textDim: '#B5AFA8',

  // Text on dark backgrounds
  textOnDark: '#F0EBE0',
  textOnDarkSecondary: '#A09888',
  textOnDarkMuted: '#6B6560',

  // Borders
  border: '#D4CFC4',           // Subtle border on cream
  borderSubtle: '#E0DBD0',
  borderLight: '#C8C3B8',
  borderDark: '#333333',       // Border on dark surfaces
  borderDarkSubtle: '#2A2A2A',

  // Functional colors (kept from game mechanics)
  success: '#22C55E',
  warning: '#D97800',
  danger: '#CC0000',
  gold: '#D4AF37',

  // Action red (for CTAs, kept but used sparingly)
  accent: '#CC0000',

  // Stat colors
  muscle: '#FF6B35',
  power: '#3B82F6',
  endurance: '#22C55E',

  // Extra
  purple: '#A855F7',
  indigo: '#6366F1',
  pink: '#EC4899',
  amber: '#F59E0B',
  electric: '#4A90FF',
};

export const classColors = {
  ROOKIE:   { main: '#6B6560', bg: '#E8E3D8', glow: '#6B656044', dark: '#1a1a1a', darkBg: '#222' },
  FIGHTER:  { main: '#22C55E', bg: '#E8F5E9', glow: '#22C55E44', dark: '#22C55E', darkBg: '#0D2E1A' },
  CHAMPION: { main: '#3B82F6', bg: '#E3F2FD', glow: '#3B82F644', dark: '#3B82F6', darkBg: '#0D1A2E' },
  WARRIOR:  { main: '#CC0000', bg: '#FBE9E7', glow: '#CC000044', dark: '#CC0000', darkBg: '#2b1111' },
};

export const gradients = {
  primary:  ['#1A1A1A', '#111111'],
  dark:     ['#1A1A1A', '#111111'],
  hero:     ['#1A1A1A', '#0F0F0F'],
  surface:  ['#1A1A1A', '#141414'],
  gold:     ['#1A1400', '#111'],
  fire:     ['#FF6B35', '#CC0000'],
  energy:   ['#C9FF47', '#22C55E'],
  cream:    ['#F0EBE0', '#E8E3D8'],
  creamDark:['#F0EBE0', '#1A1A1A'],
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
  xs: 2,
  sm: 3,
  button: 4,
  card: 4,
  cardLarge: 6,
  xl: 8,
  full: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowRadius: 8,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000',
    shadowRadius: 16,
    shadowOpacity: 0.12,
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

// Font family constants
export const fonts = {
  heading: 'BebasNeue_400Regular',
  body: undefined, // system font
};

export const typography = {
  titleHuge: { fontSize: 72, fontFamily: 'BebasNeue_400Regular', color: colors.textPrimary },
  title: { fontSize: 32, fontFamily: 'BebasNeue_400Regular', color: colors.textPrimary, letterSpacing: 1 },
  titleSm: { fontSize: 22, fontFamily: 'BebasNeue_400Regular', color: colors.textPrimary, letterSpacing: 0.5 },
  body: { fontSize: 15, fontWeight: '400', color: colors.textPrimary },
  bodyMuted: { fontSize: 14, fontWeight: '400', color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: colors.textMuted },
};

export const appTheme = {
  dark: false,
  colors,
  spacing,
  radius,
  typography,
  shadows,
  animation,
  fonts,
};
