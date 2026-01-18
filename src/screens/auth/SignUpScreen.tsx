import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

const signUpSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    city: z.string().min(2, 'City is required'),
    agreeToTerms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => data.agreeToTerms, {
    message: 'You must agree to the terms',
    path: ['agreeToTerms'],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
  const theme = useAppTheme();
  const { registerAsync, isRegistering } = useAuth();
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    setValue,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    defaultValues: {
      agreeToTerms: false,
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      const { fullName, email, password, city } = data;
      await registerAsync({ fullName, email, password, city });
      // Navigation to tabs handled by root layout
    } catch (error: any) {
      setError('root', {
        message:
          error.response?.data?.message || 'Failed to create account',
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
          <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
            Create an Account
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
            ]}
          >
            Join your local lost & found network
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message}
                autoComplete="name"
              />
            )}
          />

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
                placeholder="Minimum 8 characters"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                isPassword
                autoCapitalize="none"
                autoComplete="password-new"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="Re-enter password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                isPassword
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="city"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="City"
                placeholder="University of British Columbia"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.city?.message}
              />
            )}
          />

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => {
              const newValue = !agreeToTerms;
              setAgreeToTerms(newValue);
              setValue('agreeToTerms', newValue, { shouldValidate: true });
            }}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: agreeToTerms
                    ? theme.colors.primary
                    : 'transparent',
                },
              ]}
            >
              {agreeToTerms && (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={theme.isDark ? theme.colors.background : '#FFFFFF'}
                />
              )}
            </View>
            <Text
              style={[
                theme.typography.small,
                { color: theme.colors.textSecondary },
              ]}
            >
              I agree to the Terms & Privacy Policy
            </Text>
          </TouchableOpacity>
          {errors.agreeToTerms && (
            <Text
              style={[
                theme.typography.small,
                { color: theme.colors.error, marginTop: -8 },
              ]}
            >
              {errors.agreeToTerms.message}
            </Text>
          )}

          {errors.root && (
            <Text
              style={[
                theme.typography.small,
                { color: theme.colors.error, marginTop: theme.spacing.sm },
              ]}
            >
              {errors.root.message}
            </Text>
          )}

          <Button
            title="Sign Up"
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isRegistering}
            loading={isRegistering}
            size="large"
            style={{ marginTop: theme.spacing.md }}
          />
        </View>

        <View style={styles.footer}>
          <Text
            style={[theme.typography.body, { color: theme.colors.textSecondary }]}
          >
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.primary },
              ]}
            >
              Sign in
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
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
});
