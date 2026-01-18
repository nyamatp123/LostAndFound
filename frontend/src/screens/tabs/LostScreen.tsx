import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Card } from '../../components/common/Card';
import { LiquidPill } from '../../components/common/LiquidPill';
import { useItems } from '../../hooks/useItems';
import { Item } from '../../types';

export default function LostScreen() {
  const theme = useAppTheme();
  const { items, isLoading, refetch } = useItems('lost');

  // Categorize items
  const unfoundItems = items.filter((item: Item) => item.status === 'unfound');
  const foundItems = items.filter((item: Item) => item.status === 'found' || item.status === 'matched');
  const returnedItems = items.filter((item: Item) => item.status === 'returned');

  const renderItemCard = (item: Item) => (
    <Card
      key={item.id}
      onPress={() => router.push(`/lost/${item.id}`)}
      style={styles.itemCard}
    >
      <View style={styles.cardContent}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="image-outline" size={24} color={theme.colors.textTertiary} />
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
      </View>
    </Card>
  );

  const renderCategory = (
    title: string,
    items: Item[],
    variant: 'unfound' | 'found' | 'returned'
  ) => (
    <View style={styles.category}>
      <View style={styles.categoryHeader}>
        <LiquidPill label={title} variant={variant} />
        <Text style={[theme.typography.small, { color: theme.colors.textTertiary }]}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </Text>
      </View>
      {items.length > 0 ? (
        items.map(renderItemCard)
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
        {renderCategory('Unfound', unfoundItems, 'unfound')}
        {renderCategory('Found', foundItems, 'matched')}
        {renderCategory('Returned', returnedItems, 'returned')}
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
});
