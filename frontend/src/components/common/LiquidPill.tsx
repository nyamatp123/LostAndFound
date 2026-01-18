import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../theme';

interface LiquidPillProps {
  label: string;
  variant?: 'unfound' | 'found' | 'matched' | 'returned' | 'default';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export const LiquidPill: React.FC<LiquidPillProps> = ({
  label,
  variant = 'default',
  size = 'md',
  style,
}) => {
  const theme = useAppTheme();

  const getColors = (): [string, string] => {
    switch (variant) {
      case 'unfound':
        return [theme.colors.unfound, adjustColor(theme.colors.unfound, -20)];
      case 'found':
        return [theme.colors.found, adjustColor(theme.colors.found, -20)];
      case 'matched':
        return [theme.colors.matched, adjustColor(theme.colors.matched, -20)];
      case 'returned':
        return [theme.colors.returned, adjustColor(theme.colors.returned, -20)];
      default:
        return [theme.colors.primary, adjustColor(theme.colors.primary, -20)];
    }
  };

  const getPadding = () => {
    return size === 'sm'
      ? { paddingHorizontal: 10, paddingVertical: 4 }
      : { paddingHorizontal: 14, paddingVertical: 6 };
  };

  const getFontSize = () => {
    return size === 'sm' ? 11 : 13;
  };

  const colors = getColors();

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.pill,
          getPadding(),
          {
            borderRadius: size === 'sm' ? 12 : 16,
          },
        ]}
      >
        <Text
          style={[
            styles.label,
            {
              fontSize: getFontSize(),
              color: '#FFFFFF',
            },
          ]}
        >
          {label}
        </Text>
      </LinearGradient>
    </View>
  );
};

// Helper function to darken/lighten a hex color
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  pill: {
    // Slightly irregular blob-like shape
    borderTopLeftRadius: 14,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 14,
  },
  label: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
