import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useMatches, useMatchStatus } from '../../hooks/useMatches';

const LOCATIONS = [
  { id: 'main', name: 'Main Campus Lost & Found', address: 'Student Services Building, Room 101', hours: 'Mon-Fri 9am-5pm' },
  { id: 'library', name: 'Library Lost & Found', address: 'Main Library, Ground Floor', hours: 'Mon-Sun 8am-10pm' },
  { id: 'student-union', name: 'Student Union Info Desk', address: 'Student Union, 1st Floor', hours: 'Mon-Fri 8am-8pm' },
  { id: 'athletics', name: 'Athletics Center', address: 'Rec Center Front Desk', hours: 'Mon-Sun 6am-11pm' },
];

export default function LostAndFoundSchedulingScreen() {
  const theme = useAppTheme();
  const { matchId, type } = useLocalSearchParams<{ matchId: string; type: string }>();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  
  const isFinder = type === 'found';
  const isOwner = type === 'lost';
  
  // Enable polling for owner to detect when finder drops off
  const { matchStatus, isLoading: isLoadingStatus } = useMatchStatus(matchId, isOwner);
  const { notifyReturnAsync, isNotifying, completeReturnAsync, isCompleting } = useMatches();

  // If owner and finder already selected a location, show that
  useEffect(() => {
    if (matchStatus?.returnLocation && isOwner) {
      setSelectedLocation(matchStatus.returnLocation);
    }
  }, [matchStatus, isOwner]);

  // Handle finder confirming drop-off location and notifying owner
  const handleNotifyDropOff = async () => {
    if (!selectedLocation || !matchId) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    const location = LOCATIONS.find(l => l.id === selectedLocation);
    
    try {
      await notifyReturnAsync({
        id: matchId,
        data: {
          locationId: selectedLocation,
          locationName: location?.name || selectedLocation,
        }
      });
      
      Alert.alert(
        'Drop-off Confirmed!',
        `The owner has been notified that you dropped off the item at ${location?.name}. Thank you for helping reunite someone with their item!`,
        [{ text: 'Done', onPress: () => router.replace('/(tabs)/found' as any) }]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to notify owner';
      Alert.alert('Error', errorMessage);
    }
  };

  // Handle owner confirming pickup
  const handleConfirmPickup = async () => {
    if (!matchId) return;

    Alert.alert(
      'Confirm Pickup',
      'Have you successfully picked up your item?',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, I Got It!',
          onPress: async () => {
            try {
              await completeReturnAsync(matchId);
              Alert.alert(
                'Item Returned!',
                'Congratulations on getting your item back!',
                [{ text: 'Done', onPress: () => router.replace('/(tabs)/lost' as any) }]
              );
            } catch (error: any) {
              const errorMessage = error.response?.data?.error || error.message || 'Failed to complete return';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  if (isLoadingStatus) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Owner view - waiting for pickup
  if (isOwner && matchStatus?.notifiedAt) {
    const location = LOCATIONS.find(l => l.id === matchStatus.returnLocation) || 
      { name: matchStatus.returnLocation, address: '', hours: '' };

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[theme.typography.h3, { color: theme.colors.text }]}>Pickup Location</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Success Icon */}
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.success + '20' }]}>
            <Ionicons name="location" size={48} color={theme.colors.success} />
          </View>

          <Text style={[theme.typography.h2, { color: theme.colors.text, textAlign: 'center', marginTop: 24 }]}>
            Your item is ready!
          </Text>

          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 12, paddingHorizontal: 24 }]}>
            The finder has dropped off your item. Pick it up at:
          </Text>

          {/* Location Card */}
          <Card style={{ marginTop: 24, width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={[styles.locationIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name="business" size={24} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>
                  {location.name}
                </Text>
                {location.address && (
                  <Text style={[theme.typography.small, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                    {location.address}
                  </Text>
                )}
                {location.hours && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <Ionicons name="time-outline" size={14} color={theme.colors.textTertiary} />
                    <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginLeft: 4 }]}>
                      {location.hours}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Card>

          {/* Info */}
          <Card style={{ marginTop: 16, width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginLeft: 8 }]}>
                What to bring
              </Text>
            </View>
            <Text style={[theme.typography.small, { color: theme.colors.textSecondary, lineHeight: 20 }]}>
              • A valid student or staff ID{'\n'}
              • Description of your item to verify ownership
            </Text>
          </Card>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <Button 
            title={isCompleting ? "Confirming..." : "I've Picked Up My Item"} 
            onPress={handleConfirmPickup}
            disabled={isCompleting}
          />
          <TouchableOpacity 
            style={{ marginTop: 12, alignItems: 'center' }}
            onPress={() => router.replace('/(tabs)/lost' as any)}
          >
            <Text style={[theme.typography.body, { color: theme.colors.primary }]}>I'll pick it up later</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Owner view - waiting for finder to drop off
  if (isOwner) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[theme.typography.h3, { color: theme.colors.text }]}>Waiting for Drop-off</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={[styles.content, styles.centered]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>

          <Text style={[theme.typography.h2, { color: theme.colors.text, textAlign: 'center', marginTop: 24 }]}>
            Waiting for drop-off
          </Text>

          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 12, paddingHorizontal: 24, lineHeight: 24 }]}>
            The finder is dropping off your item at a Lost & Found location.
            {'\n\n'}
            We'll notify you as soon as it's ready for pickup!
          </Text>
        </View>

        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <Button 
            title="I'll Wait" 
            onPress={() => router.replace('/(tabs)/lost' as any)}
            variant="secondary"
          />
        </View>
      </View>
    );
  }

  // Finder view - select location and notify
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[theme.typography.h3, { color: theme.colors.text }]}>Drop-off Location</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
          Drop off the item
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}>
          Select where you will drop off the item, then confirm once you've dropped it off
        </Text>

        {/* Location Options */}
        <View style={styles.locations}>
          {LOCATIONS.map((loc) => (
            <TouchableOpacity
              key={loc.id}
              style={[
                styles.locationCard,
                {
                  borderColor: selectedLocation === loc.id ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selectedLocation === loc.id ? theme.colors.primary + '10' : theme.colors.surface,
                }
              ]}
              onPress={() => setSelectedLocation(loc.id)}
            >
              <View style={styles.locationHeader}>
                <Ionicons
                  name="business-outline"
                  size={24}
                  color={selectedLocation === loc.id ? theme.colors.primary : theme.colors.text}
                />
                {selectedLocation === loc.id && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                )}
              </View>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginTop: 12 }]}>
                {loc.name}
              </Text>
              <Text style={[theme.typography.small, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                {loc.address}
              </Text>
              <View style={styles.hoursRow}>
                <Ionicons name="time-outline" size={14} color={theme.colors.textTertiary} />
                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginLeft: 4 }]}>
                  {loc.hours}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <Card style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginLeft: 8 }]}>
              How it works
            </Text>
          </View>
          <Text style={[theme.typography.small, { color: theme.colors.textSecondary, lineHeight: 20 }]}>
            1. Select a Lost & Found location below{'\n'}
            2. Drop off the item at that location{'\n'}
            3. Tap "I've Dropped It Off" to notify the owner{'\n'}
            4. The owner will pick it up from there
          </Text>
        </Card>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Button 
          title={isNotifying ? "Confirming..." : "I've Dropped It Off"} 
          onPress={handleNotifyDropOff} 
          disabled={!selectedLocation || isNotifying} 
        />
        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, textAlign: 'center', marginTop: 8 }]}>
          Only tap this after you've physically dropped off the item
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  scrollContent: { flex: 1 },
  scrollContentContainer: { padding: 16 },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locations: { marginTop: 24, gap: 12 },
  locationCard: {
    padding: 16,
    borderWidth: 2,
    borderRadius: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  footer: { padding: 16, borderTopWidth: 1 },
});
