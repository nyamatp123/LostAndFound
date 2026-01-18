import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/theme';

export default function TabLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarShowLabel: false, // Icon-only navigation
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="lost"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size + 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="found"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="eye-outline" size={size + 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="find"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="git-compare-outline" size={size + 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size + 4} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
