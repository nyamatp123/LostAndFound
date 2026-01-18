import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext, useAppTheme } from '../src/theme';
import { UserPreferences } from '../src/types';
import { tokenManager } from '../src/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

type ThemeMode = 'light' | 'dark' | 'system';

function RootLayoutNav() {
  const theme = useAppTheme();
  const router = useRouter();
  const segments = useSegments();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await tokenManager.getToken();
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) return; // Still loading

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to sign-in if not authenticated and not already in auth group
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs if authenticated and in auth group
      router.replace('/(tabs)/lost');
    }
  }, [isAuthenticated, segments]);

  // Show loading screen while checking auth
  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lost" />
        <Stack.Screen name="found" />
        <Stack.Screen name="scheduling" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedPrefs = await AsyncStorage.getItem('userPreferences');
        if (storedPrefs) {
          const prefs: UserPreferences = JSON.parse(storedPrefs);
          setThemeMode(prefs.theme || 'system');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      const storedPrefs = await AsyncStorage.getItem('userPreferences');
      const prefs: UserPreferences = storedPrefs ? JSON.parse(storedPrefs) : {};
      prefs.theme = mode;
      await AsyncStorage.setItem('userPreferences', JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ themeMode, setTheme }}>
        <RootLayoutNav />
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}
