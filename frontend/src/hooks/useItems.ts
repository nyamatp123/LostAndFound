import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { itemsApi, CreateItemData, UpdateItemData, GetItemsParams } from '../api';

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
