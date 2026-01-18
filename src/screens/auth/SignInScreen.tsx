import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { useAppTheme } from '../../theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInScreen() {
  const theme = useAppTheme();
  const { loginAsync, isLoggingIn } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      await loginAsync(data);
      // Navigation to tabs handled by root layout
    } catch (error: any) {
      setError('root', {
        message: error.response?.data?.message || 'Invalid email or password',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[theme.typography.h1, { color: theme.colors.text }]}>
            Lost + Found
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
            ]}
          >
            Reuniting lost items across Vancouver
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="name.lastname@gmail.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                isPassword
                autoCapitalize="none"
                autoComplete="password"
              />
            )}
          />

          {errors.root && (
            <Text
              style={[
                theme.typography.small,
                { color: theme.colors.error, marginBottom: theme.spacing.md },
              ]}
            >
              {errors.root.message}
            </Text>
          )}

          <Button
            title="Sign In →"
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isLoggingIn}
            loading={isLoggingIn}
            size="large"
            style={{ marginTop: theme.spacing.md }}
          />
        </View>

        <View style={styles.footer}>
          <Text
            style={[theme.typography.body, { color: theme.colors.textSecondary }]}
          >
            Don't have an account yet?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/sign-up')}>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.primary },
              ]}
            >
              Sign up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  form: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
