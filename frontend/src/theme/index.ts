import { useColorScheme } from 'react-native';
import { createContext, useContext } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  setTheme: () => {},
});

export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const { themeMode, setTheme } = useContext(ThemeContext);

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  const colors = isDark
    ? {
        // Dark theme
        primary: '#FFFFFF',
        secondary: '#A0A0A0',
        background: '#000000',
        surface: '#1A1A1A',
        card: '#1A1A1A',
        text: '#FFFFFF',
        textSecondary: '#A0A0A0',
        textTertiary: '#666666',
        border: '#333333',
        borderLight: '#222222',
        error: '#FF4444',
        success: '#00C853',
        warning: '#FFB300',
        info: '#2196F3',
        // Category colors
        unfound: '#FF4444',
        found: '#FFB300',
        matched: '#FFB300',
        returned: '#00C853',
      }
    : {
        // Light theme
        primary: '#000000',
        secondary: '#666666',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        card: '#FFFFFF',
        text: '#000000',
        textSecondary: '#666666',
        textTertiary: '#999999',
        border: '#E0E0E0',
        borderLight: '#F0F0F0',
        error: '#D32F2F',
        success: '#388E3C',
        warning: '#F57C00',
        info: '#1976D2',
        // Category colors
        unfound: '#D32F2F',
        found: '#F57C00',
        matched: '#F57C00',
        returned: '#388E3C',
      };

  const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  };

  const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  };

  const typography = {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
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
    label: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
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

  const shadows = {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.5 : 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  };

  return {
    colors,
    spacing,
    borderRadius,
    typography,
    shadows,
    isDark,
    themeMode,
    setTheme,
  };
};

export const useAppTheme = useTheme;
