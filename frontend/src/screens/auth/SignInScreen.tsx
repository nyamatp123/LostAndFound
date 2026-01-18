import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAppTheme } from '../../theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

export default function SignInScreen() {
  const theme = useAppTheme();
  const { loginAsync, isLoggingIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignIn = async () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      await loginAsync({ email, password });
    } catch (error: any) {
      Alert.alert(
        'Sign In Failed',
        error.response?.data?.error || error.response?.data?.message || 'Invalid email or password'
      );
    }
  };

  const isFormValid = email && password && validateEmail(email);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[theme.typography.h1, { color: theme.colors.text }]}>
              Lost + Found
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, marginTop: 8 },
              ]}
            >
              Reuniting lost items across Vancouver
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="name.lastname@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            <Button
              title="Sign In →"
              onPress={handleSignIn}
              disabled={!isFormValid}
              loading={isLoggingIn}
              style={{ marginTop: 8 }}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              Don't have an account yet?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.text, textDecorationLine: 'underline' },
                ]}
              >
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  form: {
    marginBottom: 32,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
