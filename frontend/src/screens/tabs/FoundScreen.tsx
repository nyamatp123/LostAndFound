import React, { useEffect } from 'react';
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
import { useMatches, useClaimsForFinder } from '../../hooks/useMatches';
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

export default function FoundScreen() {
  const theme = useAppTheme();
  const { items, isLoading, refetch } = useItems('found');
  const { matches } = useMatches();
  const { data: claims, refetch: refetchClaims } = useClaimsForFinder();

  // Refresh claims periodically to catch new claims
  useEffect(() => {
    const interval = setInterval(() => {
      refetchClaims();
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [refetchClaims]);

  // Create a map of found item IDs to their pending claims
  const pendingClaimsMap = React.useMemo(() => {
    const map = new Map<string, any>();
    if (claims) {
      claims.forEach((claim: any) => {
        // Only show badge for pending claims
        if (claim.status === 'pending') {
          map.set(String(claim.foundItemId), claim);
        }
      });
    }
    return map;
  }, [claims]);

  // Categorize items for found tab
  const foundItems = items.filter((item: Item) => item.status === 'unfound' || item.status === 'found');
  const matchedItems = items.filter((item: Item) => item.status === 'matched');
  const returnedItems = items.filter((item: Item) => item.status === 'returned');

  const handleItemPress = (item: Item) => {
    const pendingClaim = pendingClaimsMap.get(String(item.id));
    
    if (pendingClaim) {
      // Has pending claim - go to claim review screen
      router.push(`/scheduling/claim-review?matchId=${pendingClaim.id}`);
    } else if (item.status === 'matched') {
      // Already matched - find the match and go to scheduling
      const match = matches?.find((m: any) => String(m.foundItemId) === String(item.id));
      if (match) {
        router.push(`/scheduling/preference?matchId=${match.id}&type=found`);
      } else {
        Alert.alert('Match Not Found', 'Unable to find match details. Please try again.');
      }
    } else {
      // Regular item - go to details
      router.push(`/found/${item.id}`);
    }
  };

  const renderItemCard = (item: Item) => {
    const imageUri = getItemImage(item);
    const itemName = (item as any).name || (item as any).title || 'Unnamed Item';
    const hasPendingClaim = pendingClaimsMap.has(String(item.id));
    
    return (
      <Card
        key={item.id}
        onPress={() => handleItemPress(item)}
        style={styles.itemCard}
      >
        <View style={styles.cardContent}>
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.itemImage} />
              {hasPendingClaim && (
                <View style={[styles.claimBadge, { backgroundColor: theme.colors.warning }]}>
                  <Ionicons name="hand-left" size={12} color="#fff" />
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="image-outline" size={24} color={theme.colors.textTertiary} />
              {hasPendingClaim && (
                <View style={[styles.claimBadge, { backgroundColor: theme.colors.warning }]}>
                  <Ionicons name="hand-left" size={12} color="#fff" />
                </View>
              )}
            </View>
          )}
          <View style={styles.itemInfo}>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]} numberOfLines={1}>
              {itemName}
            </Text>
            {hasPendingClaim && (
              <View style={[styles.claimLabel, { backgroundColor: theme.colors.warning + '20' }]}>
                <Text style={[theme.typography.small, { color: theme.colors.warning, fontWeight: '600' }]}>
                  Claim Request
                </Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
        </View>
      </Card>
    );
  };

  const renderCategory = (
    title: string,
    categoryItems: Item[],
    variant: 'unfound' | 'found' | 'matched' | 'returned'
  ) => {
    // Count pending claims in this category
    const pendingClaimCount = categoryItems.filter(item => pendingClaimsMap.has(String(item.id))).length;
    
    return (
      <View style={styles.category}>
        <View style={styles.categoryHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LiquidPill label={title} variant={variant} />
            {pendingClaimCount > 0 && (
              <View style={[styles.categoryBadge, { backgroundColor: theme.colors.warning }]}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{pendingClaimCount}</Text>
              </View>
            )}
          </View>
          <Text style={[theme.typography.small, { color: theme.colors.textTertiary }]}>
            {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        {categoryItems.length > 0 ? (
          categoryItems.map(renderItemCard)
        ) : (
          <Text style={[theme.typography.body, { color: theme.colors.textTertiary, marginTop: 8 }]}>
            No items in this category
          </Text>
        )}
      </View>
    );
  };

  const handleRefresh = () => {
    refetch();
    refetchClaims();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>My Found Items</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push('/found/add/location')}
        >
          <Ionicons name="add" size={24} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {renderCategory('Found', foundItems, 'unfound')}
        {renderCategory('Matched', matchedItems, 'matched')}
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
  categoryBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  itemCard: {
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
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
    position: 'relative',
  },
  claimBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  claimLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
});
