import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../theme';

interface LiquidPillProps {
  label: string;
  variant: 'unfound' | 'found' | 'matched' | 'returned';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const LiquidPill: React.FC<LiquidPillProps> = ({
  label,
  variant,
  size = 'medium',
  style,
}) => {
  const theme = useAppTheme();

  // Color gradients for liquid effect
  const gradients: Record<typeof variant, string[]> = {
    unfound: ['#DC2626', '#EF4444', '#F87171'],
    found: ['#EA580C', '#F97316', '#FB923C'],
    matched: ['#EA580C', '#F97316', '#FB923C'], // same as found
    returned: ['#16A34A', '#22C55E', '#4ADE80'],
  };

  const sizes = {
    small: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 11,
      borderRadius: 12,
    },
    medium: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      fontSize: 13,
      borderRadius: 14,
    },
    large: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      fontSize: 15,
      borderRadius: 18,
    },
  };

  const sizeStyle = sizes[size];

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: sizeStyle.borderRadius,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={gradients[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            paddingHorizontal: sizeStyle.paddingHorizontal,
            paddingVertical: sizeStyle.paddingVertical,
            borderRadius: sizeStyle.borderRadius,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              fontSize: sizeStyle.fontSize,
            },
          ]}
        >
          {label}
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Slightly irregular shape for liquid effect
    transform: [{ scaleX: 1.02 }, { scaleY: 0.98 }],
  },
  gradient: {
    overflow: 'hidden',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});
