import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import { Item, LostItemStatus } from '../../types';

export default function LostScreen() {
  const theme = useAppTheme();
  const { items, isLoading, refetch } = useItems('lost');

  // Categorize items by status
  const categorizedItems = useMemo(() => {
    if (!items) return { unfound: [], found: [], returned: [] };

    return {
      unfound: items.filter((item) => item.status === 'unfound'),
      found: items.filter((item) => item.status === 'found'),
      returned: items.filter((item) => item.status === 'returned'),
    };
  }, [items]);

  const renderItem = ({ item }: { item: Item }) => (
    <Card
      variant="elevated"
      onPress={() => router.push(`/lost/${item.id}`)}
      style={{ marginBottom: theme.spacing.md }}
    >
      <View style={styles.itemContainer}>
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={[
              styles.itemImage,
              { borderRadius: theme.borderRadius.md },
            ]}
          />
        )}
        {!item.imageUrl && (
          <View
            style={[
              styles.placeholderImage,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
              },
            ]}
          >
            <Ionicons
              name="image-outline"
              size={32}
              color={theme.colors.textTertiary}
            />
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text
            style={[
              theme.typography.h3,
              { color: theme.colors.text },
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[
              theme.typography.small,
              { color: theme.colors.textSecondary, marginTop: 4 },
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
          <View style={styles.metaContainer}>
            <Ionicons
              name="location-outline"
              size={14}
              color={theme.colors.textTertiary}
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, marginLeft: 4 },
              ]}
            >
              {item.location}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );

  const renderCategory = (
    title: string,
    items: Item[],
    variant: 'unfound' | 'found' | 'returned'
  ) => {
    if (items.length === 0) return null;

    return (
      <View style={{ marginBottom: theme.spacing.xl }}>
        <View style={styles.categoryHeader}>
          <LiquidPill label={title} variant={variant} size="medium" />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginLeft: theme.spacing.sm },
            ]}
          >
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        {items.map((item) => (
          <View key={item.id}>{renderItem({ item })}</View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
          Lost Items
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/lost/add/location')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[1]} // Dummy data to use FlatList for scroll and refresh
        renderItem={() => (
          <View style={{ padding: theme.spacing.md }}>
            {renderCategory('Unfound', categorizedItems.unfound, 'unfound')}
            {renderCategory('Found', categorizedItems.found, 'found')}
            {renderCategory('Returned', categorizedItems.returned, 'returned')}

            {items && items.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="alert-circle-outline"
                  size={64}
                  color={theme.colors.textTertiary}
                />
                <Text
                  style={[
                    theme.typography.h3,
                    { color: theme.colors.textSecondary, marginTop: theme.spacing.md },
                  ]}
                >
                  No lost items yet
                </Text>
                <Text
                  style={[
                    theme.typography.body,
                    { color: theme.colors.textTertiary, marginTop: theme.spacing.sm, textAlign: 'center' },
                  ]}
                >
                  Tap the + button to report a lost item
                </Text>
              </View>
            )}
          </View>
        )}
        keyExtractor={() => 'lost-items'}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
      />
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
    padding: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
  },
  itemImage: {
    width: 80,
    height: 80,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
});
