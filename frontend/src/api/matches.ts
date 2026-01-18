import apiClient from './client';
import { Match, PotentialMatch, ReturnMethod } from '../types';

export interface CreateMatchData {
  lostItemId: string;
  foundItemId: string;
}

export interface UpdateMatchPreferenceData {
  preference: ReturnMethod;
  returnLocation?: string;
}

export interface NotifyReturnData {
  locationId: string;
  locationName: string;
}

export interface GetMatchesParams {
  status?: string;
}

export interface MatchStatusResponse extends Match {
  userRole: 'lost' | 'found';
  bothSubmitted: boolean;
  isResolved: boolean;
}

export const matchesApi = {
  getMatches: async (params?: GetMatchesParams): Promise<Match[]> => {
    const response = await apiClient.get<Match[]>('/matches', { params });
    return response.data;
  },

  getMatch: async (id: string): Promise<Match> => {
    const response = await apiClient.get<Match>(`/matches/${id}`);
    return response.data;
  },

  getMatchStatus: async (id: string): Promise<MatchStatusResponse> => {
    const response = await apiClient.get<MatchStatusResponse>(`/matches/${id}/status`);
    return response.data;
  },

  createMatch: async (data: CreateMatchData): Promise<Match> => {
    const response = await apiClient.post<Match>('/matches', data);
    return response.data;
  },

  confirmMatch: async (id: string): Promise<Match> => {
    const response = await apiClient.post<Match>(`/matches/${id}/confirm`);
    return response.data;
  },

  rejectMatch: async (id: string): Promise<Match> => {
    const response = await apiClient.post<Match>(`/matches/${id}/reject`);
    return response.data;
  },

  updatePreference: async (id: string, data: UpdateMatchPreferenceData): Promise<Match> => {
    const response = await apiClient.put<Match>(`/matches/${id}/preference`, data);
    return response.data;
  },

  notifyReturn: async (id: string, data: NotifyReturnData): Promise<{ success: boolean; message: string; match: Match }> => {
    const response = await apiClient.post<{ success: boolean; message: string; match: Match }>(`/matches/${id}/notify`, data);
    return response.data;
  },

  completeReturn: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/matches/${id}/complete`);
    return response.data;
  },

  getPotentialMatches: async (lostItemId: string): Promise<PotentialMatch[]> => {
    const response = await apiClient.get<PotentialMatch[]>(`/matches/potential/${lostItemId}`);
    return response.data;
  },
};
