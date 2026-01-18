import { Redirect } from 'expo-router';

// The root index redirects to auth - _layout.tsx will handle further routing
export default function IndexScreen() {
  return <Redirect href="/(auth)/sign-in" />;
}
