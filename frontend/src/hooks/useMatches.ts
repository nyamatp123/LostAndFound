import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  matchesApi,
  CreateMatchData,
  UpdateMatchPreferenceData,
  NotifyReturnData,
  GetMatchesParams,
} from '../api';

export const useMatches = (params?: GetMatchesParams) => {
  const queryClient = useQueryClient();

  const matchesQuery = useQuery({
    queryKey: ['matches', params],
    queryFn: () => matchesApi.getMatches(params),
  });

  const createMatchMutation = useMutation({
    mutationFn: (data: CreateMatchData) => matchesApi.createMatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const confirmMatchMutation = useMutation({
    mutationFn: (id: string) => matchesApi.confirmMatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const rejectMatchMutation = useMutation({
    mutationFn: (id: string) => matchesApi.rejectMatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  const updatePreferenceMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMatchPreferenceData;
    }) => matchesApi.updatePreference(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['matchStatus'] });
    },
  });

  const notifyReturnMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: NotifyReturnData }) => matchesApi.notifyReturn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['matchStatus'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const completeReturnMutation = useMutation({
    mutationFn: (id: string) => matchesApi.completeReturn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['matchStatus'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    matches: matchesQuery.data,
    isLoading: matchesQuery.isLoading,
    error: matchesQuery.error,
    refetch: matchesQuery.refetch,

    createMatch: createMatchMutation.mutate,
    createMatchAsync: createMatchMutation.mutateAsync,
    isCreatingMatch: createMatchMutation.isPending,

    confirmMatch: confirmMatchMutation.mutate,
    isConfirming: confirmMatchMutation.isPending,

    rejectMatch: rejectMatchMutation.mutate,
    isRejecting: rejectMatchMutation.isPending,

    updatePreference: updatePreferenceMutation.mutate,
    updatePreferenceAsync: updatePreferenceMutation.mutateAsync,
    isUpdatingPreference: updatePreferenceMutation.isPending,
    
    // Alias for scheduling screen
    updateMatchAsync: updatePreferenceMutation.mutateAsync,
    isUpdatingMatch: updatePreferenceMutation.isPending,

    notifyReturn: notifyReturnMutation.mutate,
    notifyReturnAsync: notifyReturnMutation.mutateAsync,
    isNotifying: notifyReturnMutation.isPending,

    completeReturn: completeReturnMutation.mutate,
    completeReturnAsync: completeReturnMutation.mutateAsync,
    isCompleting: completeReturnMutation.isPending,
  };
};

export const usePotentialMatches = (lostItemId?: string) => {
  const potentialMatchesQuery = useQuery({
    queryKey: ['potentialMatches', lostItemId],
    queryFn: () => matchesApi.getPotentialMatches(lostItemId!),
    enabled: !!lostItemId,
  });

  return {
    potentialMatches: potentialMatchesQuery.data,
    isLoading: potentialMatchesQuery.isLoading,
    error: potentialMatchesQuery.error,
    refetch: potentialMatchesQuery.refetch,
  };
};

export const useMatchStatus = (matchId?: string, polling = false) => {
  const matchStatusQuery = useQuery({
    queryKey: ['matchStatus', matchId],
    queryFn: () => matchesApi.getMatchStatus(matchId!),
    enabled: !!matchId,
    refetchInterval: polling ? 5000 : false, // Poll every 5 seconds if enabled
  });

  return {
    matchStatus: matchStatusQuery.data,
    isLoading: matchStatusQuery.isLoading,
    error: matchStatusQuery.error,
    refetch: matchStatusQuery.refetch,
  };
};
