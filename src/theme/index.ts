import { useColorScheme } from 'react-native';
import { createContext, useContext } from 'react';

// Color palette
const colors = {
  // Light theme
  light: {
    background: '#FFFFFF',
    surface: '#F8F8F8',
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#E5E5E5',
    borderLight: '#F0F0F0',
    primary: '#000000',
    error: '#DC2626',
    success: '#16A34A',
    warning: '#EA580C',

    // Category colors
    unfound: '#DC2626', // red
    foundMatched: '#EA580C', // orange
    returned: '#16A34A', // green
  },

  // Dark theme
  dark: {
    background: '#000000',
    surface: '#1A1A1A',
    card: '#1F1F1F',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textTertiary: '#666666',
    border: '#333333',
    borderLight: '#2A2A2A',
    primary: '#FFFFFF',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F97316',

    // Category colors
    unfound: '#EF4444', // red
    foundMatched: '#F97316', // orange
    returned: '#22C55E', // green
  },
};

// Spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Typography
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  smallMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
};

export type Theme = {
  colors: typeof colors.light;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  shadows: typeof shadows;
  isDark: boolean;
};

// Theme hook
export const useAppTheme = (userPreference?: 'light' | 'dark' | 'system'): Theme => {
  const systemColorScheme = useColorScheme();

  const resolvedScheme =
    userPreference === 'system' || !userPreference
      ? systemColorScheme || 'light'
      : userPreference;

  const isDark = resolvedScheme === 'dark';

  return {
    colors: isDark ? colors.dark : colors.light,
    spacing,
    borderRadius,
    typography,
    shadows,
    isDark,
  };
};

// Theme context (optional, for global theme management)
export const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
} | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
