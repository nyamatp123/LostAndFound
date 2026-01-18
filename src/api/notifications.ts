import { apiClient } from './client';
import { Notification } from '../types';

export const notificationsApi = {
  async getNotifications(): Promise<Notification[]> {
    const response = await apiClient.get<Notification[]>('/notifications');
    return response.data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await apiClient.put<Notification>(
      `/notifications/${id}/read`
    );
    return response.data;
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.put('/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },
};
