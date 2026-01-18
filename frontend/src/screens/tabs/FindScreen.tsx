import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LiquidPill } from '../../components/common/LiquidPill';
import { useItems } from '../../hooks/useItems';
import { usePotentialMatches, useMatches } from '../../hooks/useMatches';
import { Item, PotentialMatch } from '../../types';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Helper to get image URL from item
const getItemImage = (item: any): string | undefined => {
  if (item.imageUrl) {
    const imageUrl = item.imageUrl;
    // Check if it's already a data URI or URL
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) {
      return imageUrl;
    }
    // Assume base64 and add prefix
    return `data:image/jpeg;base64,${imageUrl}`;
  }
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

export default function FindScreen() {
  const theme = useAppTheme();
  const { items: lostItems } = useItems('lost');
  const { createMatchAsync, isCreatingMatch } = useMatches();

  // Filter to only unfound items (include 'active' for backwards compatibility)
  const unfoundItems = lostItems.filter((item: Item) => 
    item.status === 'unfound' || (item.status as string) === 'active'
  );

  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);
  const [showPicker, setShowPicker] = useState(false);

  // Update selectedItemId when items load or change
  useEffect(() => {
    if (unfoundItems.length > 0 && !selectedItemId) {
      // Convert to string for consistency
      setSelectedItemId(String(unfoundItems[0].id));
    }
  }, [unfoundItems, selectedItemId]);

  const { potentialMatches, isLoading, refetch } = usePotentialMatches(selectedItemId);

  const selectedItem = unfoundItems.find((item: Item) => String(item.id) === selectedItemId);

  const handleClaim = async (match: PotentialMatch) => {
    if (!selectedItemId) return;

    Alert.alert(
      'Confirm Claim',
      `Are you sure this is your ${(selectedItem as any)?.title || (selectedItem as any)?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Claim It',
          onPress: async () => {
            try {
              const createdMatch = await createMatchAsync({
                lostItemId: selectedItemId,
                foundItemId: match.item.id,
              });
              // Navigate to scheduling with the match ID
              router.push(`/scheduling/preference?matchId=${createdMatch.id}&type=lost`);
            } catch (error: any) {
              // Check if it's a 409 conflict (match already exists)
              if (error.response?.status === 409 && error.response?.data?.match) {
                const existingMatch = error.response.data.match;
                Alert.alert(
                  'Already Claimed',
                  'You have already claimed this item. Would you like to check its status?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Check Status',
                      onPress: () => {
                        router.push(`/scheduling/preference?matchId=${existingMatch.id}&type=lost`);
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to create match');
              }
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderMatchCard = (match: PotentialMatch, index: number) => {
    const imageUri = getItemImage(match.item);
    
    return (
    <View
      key={match.item.id}
      style={[
        styles.matchCard,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* Image */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.matchImage} />
      ) : (
        <View style={[styles.matchImagePlaceholder, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="image-outline" size={64} color={theme.colors.textTertiary} />
        </View>
      )}

      {/* Match Score Badge */}
      <View style={styles.scoreBadge}>
        <LiquidPill
          label={`${Math.round(match.score)}% Match`}
          variant={match.score > 70 ? 'returned' : match.score > 40 ? 'found' : 'unfound'}
        />
      </View>

      {/* Info Overlay */}
      <View style={[styles.infoOverlay, { backgroundColor: theme.colors.card }]}>
        <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
          {(match.item as any).title || (match.item as any).name}
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 4 }]} numberOfLines={2}>
          {match.item.description}
        </Text>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[theme.typography.small, { color: theme.colors.textSecondary, marginLeft: 4 }]}>
              {match.item.location}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[theme.typography.small, { color: theme.colors.textSecondary, marginLeft: 4 }]}>
              {formatDate(match.item.timestamp)}
            </Text>
          </View>
        </View>

        <Button
          title="Claim This Item"
          onPress={() => handleClaim(match)}
          loading={isCreatingMatch}
          style={{ marginTop: 16 }}
        />
      </View>
    </View>
    );
  };

  // No lost items state
  if (unfoundItems.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="search-outline" size={64} color={theme.colors.textTertiary} />
        <Text style={[theme.typography.h3, { color: theme.colors.text, marginTop: 16 }]}>
          No Lost Items
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
          Add a lost item first to find potential matches
        </Text>
        <Button
          title="Add Lost Item"
          onPress={() => router.push('/lost/add/location')}
          style={{ marginTop: 24 }}
        />
      </View>
    );
  }

  const handleRefresh = () => {
    refetch();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with Item Picker */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>Find Matches</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Item Selector */}
      <TouchableOpacity
        style={[styles.itemPicker, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={() => setShowPicker(!showPicker)}
      >
        <Text style={[theme.typography.body, { color: theme.colors.text, flex: 1 }]}>
          {(selectedItem as any)?.title || (selectedItem as any)?.name || 'Select an item'}
        </Text>
        <Ionicons name={showPicker ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.text} />
      </TouchableOpacity>

      {/* Dropdown */}
      {showPicker && (
        <Card style={styles.dropdown}>
          {unfoundItems.map((item: Item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.dropdownItem,
                { borderBottomColor: theme.colors.borderLight },
              ]}
              onPress={() => {
                setSelectedItemId(String(item.id));
                setShowPicker(false);
              }}
            >
              <Text
                style={[
                  theme.typography.body,
                  {
                    color: String(item.id) === selectedItemId ? theme.colors.primary : theme.colors.text,
                  },
                ]}
              >
                {(item as any).title || (item as any).name}
              </Text>
              {String(item.id) === selectedItemId && (
                <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {/* Match Feed */}
      {isLoading ? (
        <View style={[styles.centered, { flex: 1 }]}>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            Finding matches...
          </Text>
        </View>
      ) : !potentialMatches || potentialMatches.length === 0 ? (
        <View style={[styles.centered, { flex: 1 }]}>
          <Ionicons name="search-outline" size={64} color={theme.colors.textTertiary} />
          <Text style={[theme.typography.h3, { color: theme.colors.text, marginTop: 16 }]}>
            No Matches Found
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }]}>
            We'll notify you when someone finds an item matching your description
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.matchFeed}
          pagingEnabled
          showsVerticalScrollIndicator={false}
        >
          {potentialMatches.map((match, index) => renderMatchCard(match, index))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  refreshButton: {
    padding: 8,
  },
  itemPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdown: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 0,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  matchFeed: {
    flex: 1,
    marginTop: 16,
  },
  matchCard: {
    height: height - 280,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  matchImage: {
    width: '100%',
    height: '60%',
    resizeMode: 'cover',
  },
  matchImagePlaceholder: {
    width: '100%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  infoOverlay: {
    flex: 1,
    padding: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
