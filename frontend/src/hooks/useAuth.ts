import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { authApi, tokenManager, RegisterData, LoginData } from '../api';
import { User } from '../types';

export const useAuth = () => {
  const queryClient = useQueryClient();
  
  // Track if we have a token to control when profile query runs
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  
  useEffect(() => {
    tokenManager.getToken().then(token => setHasToken(!!token));
  }, []);

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: hasToken === true, // Only run if we have a token
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => authApi.login(data),
    onSuccess: async (response) => {
      await tokenManager.setToken(response.access_token);
      setHasToken(true);
      queryClient.setQueryData(['profile'], response.user);
      router.replace('/(tabs)/lost');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: async (response) => {
      await tokenManager.setToken(response.access_token);
      setHasToken(true);
      queryClient.setQueryData(['profile'], response.user);
      router.replace('/(tabs)/lost');
    },
  });

  const logout = async () => {
    await tokenManager.removeToken();
    setHasToken(false);
    queryClient.clear();
    router.replace('/(auth)/sign-in');
  };

  const deleteAccountMutation = useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onSuccess: async () => {
      await tokenManager.removeToken();
      queryClient.clear();
      router.replace('/(auth)/sign-in');
    },
  });

  return {
    currentUser: profileQuery.data as User | undefined,
    isLoading: profileQuery.isLoading,
    isAuthenticated: !!profileQuery.data,
    error: profileQuery.error,

    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    logout,

    deleteAccount: deleteAccountMutation.mutateAsync,
    isDeletingAccount: deleteAccountMutation.isPending,
  };
};
