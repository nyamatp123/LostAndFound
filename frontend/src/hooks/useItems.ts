import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { itemsApi, CreateItemData, UpdateItemData, GetItemsParams, UpdateClaimDetailsData } from '../api';

export const useItems = (type?: 'lost' | 'found') => {
  const queryClient = useQueryClient();
  const params: GetItemsParams = type ? { type } : {};

  const itemsQuery = useQuery({
    queryKey: ['items', type],
    queryFn: () => itemsApi.getItems(params),
  });

  const createItemMutation = useMutation({
    mutationFn: (data: CreateItemData) => itemsApi.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateItemData }) =>
      itemsApi.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => itemsApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  return {
    items: itemsQuery.data || [],
    isLoading: itemsQuery.isLoading,
    error: itemsQuery.error,
    refetch: itemsQuery.refetch,

    createItem: createItemMutation.mutate,
    createItemAsync: createItemMutation.mutateAsync,
    isCreating: createItemMutation.isPending,

    updateItem: updateItemMutation.mutate,
    updateItemAsync: updateItemMutation.mutateAsync,
    isUpdating: updateItemMutation.isPending,

    deleteItem: deleteItemMutation.mutate,
    deleteItemAsync: deleteItemMutation.mutateAsync,
    isDeleting: deleteItemMutation.isPending,
  };
};

export const useItem = (id?: string) => {
  const itemQuery = useQuery({
    queryKey: ['item', id],
    queryFn: () => itemsApi.getItem(id!),
    enabled: !!id,
  });

  return {
    item: itemQuery.data,
    isLoading: itemQuery.isLoading,
    error: itemQuery.error,
    refetch: itemQuery.refetch,
  };
};

// Hook for found items with claim status (for finder dashboard)
export const useFoundItemsWithClaimStatus = (polling = false) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['foundItemsWithStatus'],
    queryFn: () => itemsApi.getFoundItemsWithClaimStatus(),
    refetchInterval: polling ? 10000 : false, // Poll every 10 seconds if enabled
  });

  const updateClaimDetailsMutation = useMutation({
    mutationFn: ({ matchId, data }: { matchId: string; data: UpdateClaimDetailsData }) =>
      itemsApi.updateClaimDetails(matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foundItemsWithStatus'] });
      queryClient.invalidateQueries({ queryKey: ['claimsForFinder'] });
      queryClient.invalidateQueries({ queryKey: ['claimDetails'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  return {
    items: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    updateClaimDetails: updateClaimDetailsMutation.mutate,
    updateClaimDetailsAsync: updateClaimDetailsMutation.mutateAsync,
    isUpdatingClaimDetails: updateClaimDetailsMutation.isPending,
  };
};
