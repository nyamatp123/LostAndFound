import { apiClient } from './client';
import { Match, MatchWithItems, ReturnMethod } from '../types';

export interface GetMatchesParams {
  lostItemId?: string;
  foundItemId?: string;
  status?: string;
}

export interface CreateMatchData {
  lostItemId: string;
  foundItemId: string;
}

export interface UpdateMatchPreferenceData {
  returnMethodPreference: ReturnMethod;
  returnLocation?: string; // For local lost and found
}

export const matchesApi = {
  async getMatches(params?: GetMatchesParams): Promise<MatchWithItems[]> {
    const response = await apiClient.get<MatchWithItems[]>('/matches', { params });
    return response.data;
  },

  async getMatchById(id: string): Promise<MatchWithItems> {
    const response = await apiClient.get<MatchWithItems>(`/matches/${id}`);
    return response.data;
  },

  async createMatch(data: CreateMatchData): Promise<Match> {
    const response = await apiClient.post<Match>('/matches', data);
    return response.data;
  },

  async confirmMatch(id: string): Promise<Match> {
    const response = await apiClient.post<Match>(`/matches/${id}/confirm`);
    return response.data;
  },

  async rejectMatch(id: string): Promise<Match> {
    const response = await apiClient.post<Match>(`/matches/${id}/reject`);
    return response.data;
  },

  async updatePreference(
    id: string,
    data: UpdateMatchPreferenceData
  ): Promise<Match> {
    const response = await apiClient.put<Match>(
      `/matches/${id}/preference`,
      data
    );
    return response.data;
  },

  async notifyReturn(id: string): Promise<Match> {
    const response = await apiClient.post<Match>(`/matches/${id}/notify`);
    return response.data;
  },

  // Get potential matches for a lost item (for Find tab)
  async getPotentialMatches(lostItemId: string): Promise<MatchWithItems[]> {
    const response = await apiClient.get<MatchWithItems[]>(
      `/matches/potential/${lostItemId}`
    );
    return response.data;
  },
};
