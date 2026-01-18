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
import { useFoundItemsWithClaimStatus } from '../../hooks/useItems';
import { ItemWithClaimStatus, ClaimStatus } from '../../api/items';

// Helper to get image URL from item
const getItemImage = (item: ItemWithClaimStatus): string | undefined => {
  if ((item as any).imageUrl) return (item as any).imageUrl;
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

// Get display text and color for claim status
const getClaimStatusDisplay = (status: ClaimStatus): { text: string; color: string; icon: string } => {
  switch (status) {
    case 'unclaimed':
      return { text: 'No Claims', color: '#6b7280', icon: 'time-outline' };
    case 'claim_pending':
      return { text: 'Claim Pending', color: '#f59e0b', icon: 'hand-left' };
    case 'accepted':
      return { text: 'Accepted', color: '#10b981', icon: 'checkmark-circle' };
    case 'negotiating':
      return { text: 'Negotiating', color: '#8b5cf6', icon: 'chatbubbles-outline' };
    case 'awaiting_pickup':
      return { text: 'Awaiting Pickup', color: '#3b82f6', icon: 'location-outline' };
    case 'returned':
      return { text: 'Returned', color: '#059669', icon: 'checkmark-done-circle' };
    case 'declined':
      return { text: 'Declined', color: '#ef4444', icon: 'close-circle' };
    default:
      return { text: 'Unknown', color: '#6b7280', icon: 'help-circle-outline' };
  }
};

export default function FoundScreen() {
  const theme = useAppTheme();
  const { items, isLoading, refetch } = useFoundItemsWithClaimStatus(true); // Enable polling

  // Categorize items by claim status
  const unclaimedItems = items.filter((item) => 
    item.claimStatus === 'unclaimed' || item.claimStatus === 'declined'
  );
  const pendingItems = items.filter((item) => 
    item.claimStatus === 'claim_pending' || item.claimStatus === 'negotiating'
  );
  const activeItems = items.filter((item) => 
    item.claimStatus === 'accepted' || item.claimStatus === 'awaiting_pickup'
  );
  const returnedItems = items.filter((item) => item.claimStatus === 'returned');

  const handleItemPress = (item: ItemWithClaimStatus) => {
    if (item.activeClaim) {
      // Has an active claim - navigate based on status
      const matchId = item.activeClaim.matchId;
      const resolvedMethod = item.activeClaim.resolvedReturnMethod;
      
      if (item.claimStatus === 'claim_pending') {
        // Go to claim review to accept/decline
        router.push(`/scheduling/claim-review?matchId=${matchId}`);
      } else if (item.claimStatus === 'negotiating') {
        // Awaiting claimant response, show status
        router.push(`/scheduling/claim-review?matchId=${matchId}`);
      } else if (item.claimStatus === 'accepted' || item.claimStatus === 'awaiting_pickup') {
        // Check if method is already resolved
        if (resolvedMethod === 'in_person') {
          // Go to contact info screen
          router.push(`/scheduling/contact-info?matchId=${matchId}&type=found`);
        } else if (resolvedMethod === 'local_lost_and_found') {
          // Go to L&F screen
          router.push(`/scheduling/lost-and-found?matchId=${matchId}&type=found`);
        } else {
          // Not resolved yet - go to preference screen
          router.push(`/scheduling/preference?matchId=${matchId}&type=found`);
        }
      } else if (item.claimStatus === 'returned') {
        // Item is returned - just show item details, no contact info needed
        router.push(`/found/${item.id}`);
      } else if (item.claimStatus === 'declined') {
        // Declined - just show item details
        router.push(`/found/${item.id}`);
      }
    } else {
      // No claim - go to item details
      router.push(`/found/${item.id}`);
    }
  };

  const renderClaimStatusBadge = (item: ItemWithClaimStatus) => {
    const statusInfo = getClaimStatusDisplay(item.claimStatus);
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
        <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.text}
        </Text>
      </View>
    );
  };

  const renderItemCard = (item: ItemWithClaimStatus) => {
    const imageUri = getItemImage(item);
    const itemName = (item as any).name || (item as any).title || 'Unnamed Item';
    const statusInfo = getClaimStatusDisplay(item.claimStatus);
    const hasPendingAction = item.claimStatus === 'claim_pending';
    
    return (
      <Card
        key={item.id}
        onPress={() => handleItemPress(item)}
        style={[
          styles.itemCard,
          hasPendingAction && { borderLeftWidth: 3, borderLeftColor: statusInfo.color }
        ]}
      >
        <View style={styles.cardContent}>
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.itemImage} />
              {hasPendingAction && (
                <View style={[styles.claimBadge, { backgroundColor: statusInfo.color }]}>
                  <Ionicons name={statusInfo.icon as any} size={12} color="#fff" />
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="image-outline" size={24} color={theme.colors.textTertiary} />
              {hasPendingAction && (
                <View style={[styles.claimBadge, { backgroundColor: statusInfo.color }]}>
                  <Ionicons name={statusInfo.icon as any} size={12} color="#fff" />
                </View>
              )}
            </View>
          )}
          <View style={styles.itemInfo}>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]} numberOfLines={1}>
              {itemName}
            </Text>
            {renderClaimStatusBadge(item)}
          </View>
          <View style={styles.actionHint}>
            {hasPendingAction ? (
              <View style={[styles.actionButton, { backgroundColor: statusInfo.color }]}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>REVIEW</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            )}
          </View>
        </View>
      </Card>
    );
  };

  const renderCategory = (
    title: string,
    categoryItems: ItemWithClaimStatus[],
    variant: 'unfound' | 'found' | 'matched' | 'returned',
    showBadge = false
  ) => {
    if (categoryItems.length === 0) return null;
    
    return (
      <View style={styles.category}>
        <View style={styles.categoryHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LiquidPill label={title} variant={variant} />
            {showBadge && categoryItems.length > 0 && (
              <View style={[styles.categoryBadge, { backgroundColor: theme.colors.warning }]}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{categoryItems.length}</Text>
              </View>
            )}
          </View>
          <Text style={[theme.typography.small, { color: theme.colors.textTertiary }]}>
            {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        {categoryItems.map(renderItemCard)}
      </View>
    );
  };

  const handleRefresh = () => {
    refetch();
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
        {/* Pending claims first - most important */}
        {renderCategory('Needs Action', pendingItems, 'matched', true)}
        
        {/* Active claims in progress */}
        {renderCategory('In Progress', activeItems, 'found')}
        
        {/* Unclaimed items */}
        {renderCategory('No Claims Yet', unclaimedItems, 'unfound')}
        
        {/* Returned items */}
        {renderCategory('Returned', returnedItems, 'returned')}
        
        {items.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={[theme.typography.h3, { color: theme.colors.text, marginTop: 16 }]}>
              No Found Items
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
              Report items you've found to help reunite them with their owners
            </Text>
          </View>
        )}
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionHint: {
    marginLeft: 8,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
});
