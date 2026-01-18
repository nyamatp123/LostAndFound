import { Stack } from 'expo-router';
import { useAppTheme } from '../../src/theme';

export default function LostLayout() {
  const theme = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen name="add/location" />
      <Stack.Screen name="add/timestamp" />
      <Stack.Screen name="add/name" />
      <Stack.Screen name="add/description" />
      <Stack.Screen name="add/photo" />
      <Stack.Screen name="add/review" />
    </Stack>
  );
}
