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

export interface DeclineClaimData {
  reason: 'wrong_person' | 'suggest_alternative';
  message?: string;
}

export interface ProposeAlternativeData {
  returnMethod: 'in_person' | 'local_lost_and_found';
  location?: string;
  locationName?: string;
  message?: string;
}

export interface GetMatchesParams {
  status?: string;
}

export interface MatchStatusResponse {
  id: number;
  status: string;
  lostUserPreference?: string;
  foundUserPreference?: string;
  resolvedReturnMethod?: string;
  returnLocation?: string;
  notifiedAt?: string;
  userRole: 'lost' | 'found';
  bothSubmitted: boolean;
  isResolved: boolean;
  navigationTarget: 'preference' | 'waiting' | 'contact_info' | 'lost_and_found' | null;
  otherPartyContact?: {
    name: string;
    email: string;
    phone?: string;
  } | null;
}

export interface ClaimDetailsResponse {
  match: {
    id: number;
    status: string;
    confidence: number;
    lostUserPreference?: string;
    foundUserPreference?: string;
    resolvedReturnMethod?: string;
    returnLocation?: string;
    notifiedAt?: string;
    declineReason?: string;
    proposedReturnMethod?: string;
    proposedLocation?: string;
    proposedLocationName?: string;
    createdAt: string;
    updatedAt: string;
  };
  // claimant is null until resolved with in_person method
  claimant: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  } | null;
  lostItem: {
    id: number;
    title: string;
    description: string;
    category: string;
    location: any;
    timestamp: string;
    imageUrls?: string[];
  };
  foundItem: {
    id: number;
    title: string;
    description: string;
  };
  finderState: string;
}

export interface LostItemMatchResponse {
  matchId: number;
  status: string;
  lostUserPreference?: string;
  foundUserPreference?: string;
  resolvedReturnMethod?: string;
  returnLocation?: string;
  notifiedAt?: string;
  navigationTarget: 'preference' | 'waiting' | 'contact_info' | 'lost_and_found';
  finderContact?: {
    name: string;
    email: string;
    phone?: string;
  } | null;
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

  getClaimDetails: async (id: string): Promise<ClaimDetailsResponse> => {
    const response = await apiClient.get<ClaimDetailsResponse>(`/matches/${id}/claim-details`);
    return response.data;
  },

  getClaimsForFinder: async (): Promise<Match[]> => {
    const response = await apiClient.get<Match[]>('/matches/claims');
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

  acceptClaim: async (id: string): Promise<{ success: boolean; message: string; match: Match; alreadyProcessed?: boolean }> => {
    const response = await apiClient.post<{ success: boolean; message: string; match: Match; alreadyProcessed?: boolean }>(`/matches/${id}/accept`);
    return response.data;
  },

  declineClaim: async (id: string, data: DeclineClaimData): Promise<{ success: boolean; message: string; match: Match }> => {
    const response = await apiClient.post<{ success: boolean; message: string; match: Match }>(`/matches/${id}/decline`, data);
    return response.data;
  },

  proposeAlternative: async (id: string, data: ProposeAlternativeData): Promise<{ success: boolean; message: string; match: Match }> => {
    const response = await apiClient.post<{ success: boolean; message: string; match: Match }>(`/matches/${id}/propose`, data);
    return response.data;
  },

  acceptProposal: async (id: string): Promise<{ success: boolean; message: string; match: Match }> => {
    const response = await apiClient.post<{ success: boolean; message: string; match: Match }>(`/matches/${id}/accept-proposal`);
    return response.data;
  },

  rejectProposal: async (id: string): Promise<{ success: boolean; message: string; match: Match }> => {
    const response = await apiClient.post<{ success: boolean; message: string; match: Match }>(`/matches/${id}/reject-proposal`);
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

  getMatchForLostItem: async (itemId: string): Promise<LostItemMatchResponse> => {
    const response = await apiClient.get<LostItemMatchResponse>(`/matches/lost-item/${itemId}`);
    return response.data;
  },
};
