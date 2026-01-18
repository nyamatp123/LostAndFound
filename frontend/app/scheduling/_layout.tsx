import { Stack } from 'expo-router';
import { useAppTheme } from '../../src/theme';

export default function SchedulingLayout() {
  const theme = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="preference" />
      <Stack.Screen name="in-person" />
      <Stack.Screen name="lost-and-found" />
      <Stack.Screen name="waiting" />
    </Stack>
  );
}
