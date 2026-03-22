import { useThemeStore } from '../store/themeStore';

const common = {
  sale: '#FF0000',
  saleBadgeBg: 'rgba(5, 5, 6, 0.85)',
  soldOut: '#999999',
  soldOutBg: 'rgba(0, 0, 0, 0.4)',
  badge: '#FF0000',
  tabBar: '#000000',
  tabActive: '#FFFFFF',
  tabInactive: '#666666',
  cartBadge: '#FF3B30',
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#007AFF',
  iosBlue: '#007AFF',
  iosGreen: '#34C759',
  iosRed: '#FF3B30',
  iosGray: '#8E8E93',
  razorpay: '#000000',
};

export const lightColors = {
  ...common,
  primary: '#000000',
  background: '#FFFFFF',
  foreground: '#050506',
  surface: 'rgba(0, 0, 0, 0.03)',
  card: 'rgba(0, 0, 0, 0.03)',
  cardForeground: '#050506',
  text: '#050506',
  textSecondary: '#494D52',
  textMuted: 'rgba(5, 5, 6, 0.45)',
  textLight: 'rgba(5, 5, 6, 0.35)',
  textExtraLight: 'rgba(5, 5, 6, 0.25)',
  border: 'rgba(0, 0, 0, 0.1)',
  borderLight: 'rgba(5, 5, 6, 0.08)',
  borderExtraLight: 'rgba(5, 5, 6, 0.04)',
  input: 'rgba(0, 0, 0, 0.05)',
  price: 'rgba(5, 5, 6, 0.65)',
  comparePrice: 'rgba(5, 5, 6, 0.20)',
  iosLightGray: 'rgba(0, 0, 0, 0.02)',
  iosDarkCard: 'rgba(0, 0, 0, 0.05)',
  glassBg: 'rgba(255, 255, 255, 0.55)',
  glassBorder: 'rgba(5, 5, 6, 0.08)',
};

export const darkColors = {
  ...common,
  primary: '#FFFFFF',
  background: '#000000',
  foreground: '#FFFFFF',
  surface: 'rgba(255, 255, 255, 0.03)',
  card: 'rgba(255, 255, 255, 0.03)',
  cardForeground: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#A0A0A5',
  textMuted: 'rgba(255, 255, 255, 0.45)',
  textLight: 'rgba(255, 255, 255, 0.35)',
  textExtraLight: 'rgba(255, 255, 255, 0.25)',
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  borderExtraLight: 'rgba(255, 255, 255, 0.02)',
  input: 'rgba(255, 255, 255, 0.05)',
  price: 'rgba(255, 255, 255, 0.65)',
  comparePrice: 'rgba(255, 255, 255, 0.25)',
  iosLightGray: 'rgba(255, 255, 255, 0.02)',
  iosDarkCard: 'rgba(255, 255, 255, 0.05)',
  glassBg: 'rgba(0, 0, 0, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};

export const useColors = () => {
  const theme = useThemeStore((state) => state.theme);
  return theme === 'light' ? lightColors : darkColors;
};

// Legacy Export for existing components (will be light mode by default)
export const colors = lightColors;
