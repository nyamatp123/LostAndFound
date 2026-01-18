import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext, useAppTheme } from '../src/theme';
import { UserPreferences } from '../src/types';
import { tokenManager } from '../src/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PREFERENCES_KEY = 'user_preferences';

export default function RootLayout() {
  const [userThemePreference, setUserThemePreference] = useState<
    'light' | 'dark' | 'system'
  >('system');
  const [isReady, setIsReady] = useState(false);
  const theme = useAppTheme(userThemePreference);

  // Load preferences and check auth on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load theme preference
        const prefsJson = await AsyncStorage.getItem(PREFERENCES_KEY);
        if (prefsJson) {
          const prefs: UserPreferences = JSON.parse(prefsJson);
          setUserThemePreference(prefs.theme);
        }

        // Check if user is authenticated
        const token = await tokenManager.getToken();
        if (token) {
          // User has token, navigate to tabs
          router.replace('/(tabs)/lost');
        } else {
          // No token, navigate to sign in
          router.replace('/(auth)/sign-in');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        router.replace('/(auth)/sign-in');
      } finally {
        setIsReady(true);
      }
    };

    initialize();
  }, []);

  const setTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    setUserThemePreference(newTheme);
    try {
      const prefsJson = await AsyncStorage.getItem(PREFERENCES_KEY);
      const prefs: UserPreferences = prefsJson
        ? JSON.parse(prefsJson)
        : {
            theme: 'system',
            compactView: false,
            privacyContactInfoHidden: true,
            notificationsEnabled: true,
            notificationTypes: {
              matchAlerts: true,
              confirmationUpdates: true,
              retrievalUpdates: true,
            },
            emailNotifications: false,
          };
      prefs.theme = newTheme;
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  if (!isReady) {
    return null; // or a splash screen
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}
