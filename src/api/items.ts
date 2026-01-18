import { apiClient } from './client';
import { Item, ItemType } from '../types';

export interface CreateItemData {
  type: ItemType;
  name: string;
  description: string;
  location: string;
  locationCoords?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  imageUrl?: string;
}

export interface UpdateItemData {
  name?: string;
  description?: string;
  location?: string;
  locationCoords?: {
    latitude: number;
    longitude: number;
  };
  timestamp?: string;
  imageUrl?: string;
  status?: string;
}

export const itemsApi = {
  async getMyItems(type?: ItemType): Promise<Item[]> {
    const params = type ? { type } : {};
    const response = await apiClient.get<Item[]>('/items', { params });
    return response.data;
  },

  async getItemById(id: string): Promise<Item> {
    const response = await apiClient.get<Item>(`/items/${id}`);
    return response.data;
  },

  async createItem(data: CreateItemData): Promise<Item> {
    const response = await apiClient.post<Item>('/items', data);
    return response.data;
  },

  async updateItem(id: string, data: UpdateItemData): Promise<Item> {
    const response = await apiClient.put<Item>(`/items/${id}`, data);
    return response.data;
  },

  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/items/${id}`);
  },
};
