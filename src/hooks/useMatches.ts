import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  matchesApi,
  CreateMatchData,
  UpdateMatchPreferenceData,
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
    },
  });

  const notifyReturnMutation = useMutation({
    mutationFn: (id: string) => matchesApi.notifyReturn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
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

    notifyReturn: notifyReturnMutation.mutate,
    isNotifying: notifyReturnMutation.isPending,
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
