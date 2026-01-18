import { apiClient, tokenManager } from './client';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from '../types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      '/auth/login',
      credentials
    );

    if (response.data.token) {
      await tokenManager.setToken(response.data.token);
    }

    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      '/auth/register',
      data
    );

    if (response.data.token) {
      await tokenManager.setToken(response.data.token);
    }

    return response.data;
  },

  async logout(): Promise<void> {
    await tokenManager.removeToken();
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await tokenManager.getToken();
    return !!token;
  },
};
