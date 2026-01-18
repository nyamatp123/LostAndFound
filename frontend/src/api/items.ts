import apiClient from './client';
import { Item } from '../types';

export interface CreateItemData {
  type: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  images?: string[];
  attributes?: Record<string, any>;
}

export interface UpdateItemData extends Partial<CreateItemData> {
  status?: 'unfound' | 'found' | 'matched' | 'returned';
}

export interface GetItemsParams {
  type?: 'lost' | 'found';
  status?: string;
}

export type ClaimStatus = 'unclaimed' | 'claim_pending' | 'accepted' | 'negotiating' | 'awaiting_pickup' | 'returned' | 'declined';

export interface ActiveClaim {
  matchId: number;
  status: string;
  claimantName: string;
  claimantId: number;
  resolvedReturnMethod?: string;
  notifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemWithClaimStatus extends Item {
  claimStatus: ClaimStatus;
  activeClaim: ActiveClaim | null;
}

export interface UpdateClaimDetailsData {
  returnLocation?: string;
  returnLocationName?: string;
  returnMethod?: 'in_person' | 'local_lost_and_found';
}

export const itemsApi = {
  getItems: async (params?: GetItemsParams): Promise<Item[]> => {
    const response = await apiClient.get<Item[]>('/items', { params });
    return response.data;
  },

  getItem: async (id: string): Promise<Item> => {
    const response = await apiClient.get<Item>(`/items/${id}`);
    return response.data;
  },

  getFoundItemsWithClaimStatus: async (): Promise<ItemWithClaimStatus[]> => {
    const response = await apiClient.get<ItemWithClaimStatus[]>('/items/found-with-status');
    return response.data;
  },

  createItem: async (data: CreateItemData): Promise<Item> => {
    const response = await apiClient.post<Item>('/items', data);
    return response.data;
  },

  updateItem: async (id: string, data: UpdateItemData): Promise<Item> => {
    const response = await apiClient.put<Item>(`/items/${id}`, data);
    return response.data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/items/${id}`);
  },

  updateClaimDetails: async (matchId: string, data: UpdateClaimDetailsData): Promise<{ success: boolean; message: string; match: any }> => {
    const response = await apiClient.put<{ success: boolean; message: string; match: any }>(`/items/claims/${matchId}`, data);
    return response.data;
  },

  uploadImage: async (uri: string): Promise<string> => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri,
      name: filename,
      type,
    } as any);

    const response = await apiClient.post<{ url: string }>('/items/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  },
};
