import apiClient from './client';
import { AuthResponse, User } from '../types';

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  university?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    // Transform fullName to name for backend compatibility
    const payload = {
      email: data.email,
      password: data.password,
      name: data.fullName,
      university: data.university,
    };
    const response = await apiClient.post<AuthResponse>('/auth/register', payload);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.put('/auth/password', data);
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/auth/account');
  },
};
