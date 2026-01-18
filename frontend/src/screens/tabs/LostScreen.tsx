import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Card } from '../../components/common/Card';
import { LiquidPill } from '../../components/common/LiquidPill';
import { useItems } from '../../hooks/useItems';
import { Item } from '../../types';

// Helper to get image URL from item
const getItemImage = (item: Item): string | undefined => {
  if (item.imageUrl) return item.imageUrl;
  if (item.imageUrls && item.imageUrls.length > 0) {
    const firstImage = item.imageUrls[0];
    // Check if it's already a data URI or URL
    if (firstImage.startsWith('data:') || firstImage.startsWith('http')) {
      return firstImage;
    }
    // Assume base64 and add prefix
    return `data:image/jpeg;base64,${firstImage}`;
  }
  return undefined;
};

// Helper to format location
const formatLocation = (location: string | { latitude: number; longitude: number } | any): string => {
  if (!location) return 'Location not specified';
  
  // If it's already a nicely formatted string (not JSON)
  if (typeof location === 'string') {
    try {
      const parsed = JSON.parse(location);
      if (parsed.latitude !== undefined && parsed.longitude !== undefined) {
        return `${parsed.latitude.toFixed(4)}, ${parsed.longitude.toFixed(4)}`;
      }
      return location;
    } catch {
      // Not JSON, return as-is if it doesn't look like JSON
      if (!location.startsWith('{')) {
        return location;
      }
      return 'Location not specified';
    }
  }
  
  // If it's an object with coordinates
  if (typeof location === 'object' && location.latitude !== undefined && location.longitude !== undefined) {
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }
  
  return 'Location not specified';
};

export default function LostScreen() {
  const theme = useAppTheme();
  const { items, isLoading, refetch, deleteItem, isDeleting } = useItems('lost');

  // Categorize items based on status
  // unfound = no match yet, found/matched = match exists but not returned, returned = completed
  const unfoundItems = items.filter((item: Item) => item.status === 'unfound' || (item.status as string) === 'active');
  const foundItems = items.filter((item: Item) => item.status === 'matched');
  const returnedItems = items.filter((item: Item) => item.status === 'returned');

  const handleDeleteItem = (item: Item) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${(item as any).name || (item as any).title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteItem(item.id);
          },
        },
      ]
    );
  };

  const renderItemCard = (item: Item, showDelete: boolean = false) => {
    const imageUri = getItemImage(item);
    const itemName = (item as any).name || (item as any).title || 'Unnamed Item';
    
    return (
      <Card
        key={item.id}
        onPress={() => router.push(`/lost/${item.id}`)}
        style={styles.itemCard}
      >
        <View style={styles.cardContent}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.itemImage} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="image-outline" size={24} color={theme.colors.textTertiary} />
            </View>
          )}
          <View style={styles.itemInfo}>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]} numberOfLines={1}>
              {itemName}
            </Text>
          </View>
          {showDelete && (
            <TouchableOpacity
              onPress={() => handleDeleteItem(item)}
              style={styles.deleteButton}
              disabled={isDeleting}
            >
              <Ionicons name="trash-outline" size={20} color={theme.colors.error || '#FF3B30'} />
            </TouchableOpacity>
          )}
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
        </View>
      </Card>
    );
  };

  const renderCategory = (
    title: string,
    categoryItems: Item[],
    variant: 'unfound' | 'found' | 'returned',
    showDelete: boolean = false
  ) => (
    <View style={styles.category}>
      <View style={styles.categoryHeader}>
        <LiquidPill label={title} variant={variant} />
        <Text style={[theme.typography.small, { color: theme.colors.textTertiary }]}>
          {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
        </Text>
      </View>
      {categoryItems.length > 0 ? (
        categoryItems.map((item) => renderItemCard(item, showDelete))
      ) : (
        <Text style={[theme.typography.body, { color: theme.colors.textTertiary, marginTop: 8 }]}>
          No items in this category
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>My Lost Items</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push('/lost/add/location')}
        >
          <Ionicons name="add" size={24} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {renderCategory('Unfound', unfoundItems, 'unfound', true)}
        {renderCategory('Found', foundItems, 'found', false)}
        {renderCategory('Returned', returnedItems, 'returned', false)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  category: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemCard: {
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deleteButton: {
    padding: 8,
    marginRight: 4,
  },
});
