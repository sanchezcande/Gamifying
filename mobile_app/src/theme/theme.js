export const colors = {
  background: '#0A0A0A',
  primary: '#CC0000',
  surface: '#161616',
  card: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  border: '#2A2A2A',
  success: '#1F8B4C',
  warning: '#D97800',
  danger: '#CC0000',
  gold: '#D4AF37'
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28
};

export const radius = {
  button: 8,
  card: 12,
  cardLarge: 16
};

export const typography = {
  titleHuge: { fontSize: 72, fontWeight: '800', color: colors.textPrimary },
  title: { fontSize: 32, fontWeight: '700', color: colors.textPrimary },
  titleSm: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400', color: colors.textPrimary },
  bodyMuted: { fontSize: 14, fontWeight: '400', color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '500', color: colors.textSecondary }
};

export const appTheme = {
  dark: true,
  colors,
  spacing,
  radius,
  typography
};
