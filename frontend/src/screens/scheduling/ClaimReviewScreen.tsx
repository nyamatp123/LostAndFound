import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useClaimDetails, useAcceptClaim, useDeclineClaim, useProposeAlternative } from '../../hooks/useMatches';
import { useFoundItemsWithClaimStatus } from '../../hooks/useItems';

type DeclineReason = 'wrong_person' | 'suggest_alternative';
type ProposedMethod = 'in_person' | 'local_lost_and_found';

// Helper to get image URL
const getItemImage = (imageUrls?: string[]): string | undefined => {
  if (!imageUrls || imageUrls.length === 0) return undefined;
  const firstImage = imageUrls[0];
  if (firstImage.startsWith('data:') || firstImage.startsWith('http')) {
    return firstImage;
  }
  return `data:image/jpeg;base64,${firstImage}`;
};

// Helper to format location
const formatLocation = (location: any): string => {
  if (!location) return 'Location not specified';
  if (typeof location === 'string') {
    try {
      const parsed = JSON.parse(location);
      if (parsed.latitude && parsed.longitude) {
        return `${parsed.latitude.toFixed(4)}, ${parsed.longitude.toFixed(4)}`;
      }
      return location;
    } catch {
      return location;
    }
  }
  if (location.latitude && location.longitude) {
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }
  return 'Location not specified';
};

// Format preference display
const formatPreference = (pref?: string): string => {
  switch (pref) {
    case 'in_person': return 'Meet In-Person';
    case 'local_lost_and_found': return 'Lost & Found Office';
    case 'no_preference': return "Doesn't Mind";
    default: return 'Not yet selected';
  }
};

export default function ClaimReviewScreen() {
  const theme = useAppTheme();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  
  const { data, isLoading, error, refetch } = useClaimDetails(matchId);
  const { mutateAsync: acceptClaim, isPending: isAccepting } = useAcceptClaim();
  const { mutateAsync: declineClaim, isPending: isDeclining } = useDeclineClaim();
  const { mutateAsync: proposeAlternative, isPending: isProposing } = useProposeAlternative();

  const [showDeclineOptions, setShowDeclineOptions] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [declineMessage, setDeclineMessage] = useState('');
  const [proposedMethod, setProposedMethod] = useState<ProposedMethod>('in_person');
  const [proposedLocationName, setProposedLocationName] = useState('');
  const [showEditLocation, setShowEditLocation] = useState(false);
  const [editLocationValue, setEditLocationValue] = useState('');

  // Hook for updating claim details
  const { updateClaimDetailsAsync, isUpdatingClaimDetails } = useFoundItemsWithClaimStatus();

  // Auto-refresh to check for state changes
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  const handleAccept = async () => {
    try {
      const result = await acceptClaim(matchId!);
      // Check if claim was already processed
      if (result.alreadyProcessed) {
        Alert.alert('Claim Status', `This claim has already been ${result.match.status}. Continuing to the next step.`, [
          { text: 'Continue', onPress: () => router.push(`/scheduling/preference?matchId=${matchId}&type=found`) }
        ]);
      } else {
        Alert.alert('Success', 'Claim accepted! Please select your return preference.', [
          { text: 'Continue', onPress: () => router.push(`/scheduling/preference?matchId=${matchId}&type=found`) }
        ]);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to accept claim';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDeclineWrongPerson = async () => {
    try {
      await declineClaim({ matchId: matchId!, reason: 'wrong_person', message: declineMessage });
      Alert.alert('Claim Declined', 'The claimant has been notified.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to decline claim';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleProposeAlternative = async () => {
    if (!proposedLocationName.trim() && proposedMethod === 'in_person') {
      Alert.alert('Error', 'Please enter a proposed meeting location');
      return;
    }
    try {
      await proposeAlternative({
        matchId: matchId!,
        returnMethod: proposedMethod,
        locationName: proposedLocationName,
        message: declineMessage
      });
      Alert.alert('Proposal Sent', 'The claimant will be notified of your proposal.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to send proposal';
      Alert.alert('Error', errorMessage);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 16 }]}>
          Loading claim details...
        </Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
        <Text style={[theme.typography.body, { color: theme.colors.error, marginTop: 16 }]}>
          Failed to load claim details
        </Text>
        <Button title="Try Again" onPress={() => refetch()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const { match, claimant, lostItem, foundItem, finderState } = data;
  const imageUri = getItemImage(lostItem.imageUrls);

  // Show different UI based on state
  if (finderState === 'awaiting_claimant_response') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[theme.typography.h3, { color: theme.colors.text }]}>Awaiting Response</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.centered, { flex: 1 }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[theme.typography.h3, { color: theme.colors.text, marginTop: 24, textAlign: 'center' }]}>
            Waiting for Claimant's Response
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center', paddingHorizontal: 32 }]}>
            You've sent a counter-proposal. We'll notify you when they respond.
          </Text>
        </View>
      </View>
    );
  }

  if (finderState === 'declined') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[theme.typography.h3, { color: theme.colors.text }]}>Claim Declined</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.centered, { flex: 1 }]}>
          <Ionicons name="close-circle" size={64} color={theme.colors.error} />
          <Text style={[theme.typography.h3, { color: theme.colors.text, marginTop: 24, textAlign: 'center' }]}>
            This Claim Was Declined
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center', paddingHorizontal: 32 }]}>
            The item is now available for other claims.
          </Text>
          <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  if (finderState !== 'pending_review') {
    // Show the current state with options to view details or continue scheduling
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[theme.typography.h3, { color: theme.colors.text }]}>Claim Status</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Status Banner */}
          <View style={[styles.alertBanner, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons 
              name={
                finderState === 'completed' ? 'checkmark-done-circle' :
                finderState === 'awaiting_pickup' ? 'location-outline' :
                finderState === 'needs_dropoff' ? 'business-outline' :
                'time-outline'
              } 
              size={24} 
              color={theme.colors.primary} 
            />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>
                {finderState === 'completed' ? 'Item Returned Successfully!' :
                 finderState === 'awaiting_pickup' ? 'Waiting for Pickup' :
                 finderState === 'needs_dropoff' ? 'Ready for Drop-off' :
                 finderState === 'needs_preference' ? 'Select Return Method' :
                 finderState === 'awaiting_resolution' ? 'Waiting for Preference' :
                 finderState === 'scheduling_meetup' ? 'Scheduling Meetup' :
                 'Claim Accepted'}
              </Text>
              <Text style={[theme.typography.small, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                {finderState === 'completed' ? 'Thank you for helping!' :
                 finderState === 'awaiting_pickup' ? 'The claimant will pick up the item soon' :
                 finderState === 'needs_dropoff' ? 'Please drop off the item at the designated location' :
                 finderState === 'needs_preference' ? 'Choose how you want to return the item' :
                 finderState === 'awaiting_resolution' ? 'Waiting for both parties to submit preferences' :
                 'Arranging return with claimant'}
              </Text>
            </View>
          </View>

          {/* Claimant Info - Only show contact details if in-person method resolved */}
          {claimant ? (
            <Card style={styles.section}>
              <Text style={[theme.typography.h3, { color: theme.colors.text, marginBottom: 16, fontSize: 18 }]}>
                Claimant Contact Info
              </Text>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={[theme.typography.body, { color: theme.colors.text, marginLeft: 12 }]}>
                  {claimant.name}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={[theme.typography.body, { color: theme.colors.text, marginLeft: 12 }]}>
                  {claimant.email}
                </Text>
              </View>
              {claimant.phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color={theme.colors.textSecondary} />
                  <Text style={[theme.typography.body, { color: theme.colors.text, marginLeft: 12 }]}>
                    {claimant.phone}
                  </Text>
                </View>
              )}
            </Card>
          ) : (
            <Card style={styles.section}>
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.success} />
                <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginLeft: 12 }]}>
                  Claimant identity is protected until return method is finalized
                </Text>
              </View>
            </Card>
          )}

          {/* Return Details */}
          <Card style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[theme.typography.h3, { color: theme.colors.text, fontSize: 18 }]}>
                Return Details
              </Text>
              {finderState !== 'completed' && finderState !== 'awaiting_pickup' && (
                <TouchableOpacity 
                  onPress={() => {
                    setEditLocationValue(match.returnLocation || '');
                    setShowEditLocation(!showEditLocation);
                  }}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="pencil-outline" size={18} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="swap-horizontal-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={[theme.typography.body, { color: theme.colors.text, marginLeft: 12 }]}>
                Method: {formatPreference(match.resolvedReturnMethod || match.foundUserPreference)}
              </Text>
            </View>
            {match.returnLocation && !showEditLocation && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={[theme.typography.body, { color: theme.colors.text, marginLeft: 12 }]}>
                  Location: {match.returnLocation}
                </Text>
              </View>
            )}
            {showEditLocation && (
              <View style={{ marginTop: 12 }}>
                <Text style={[theme.typography.small, { color: theme.colors.textSecondary, marginBottom: 4 }]}>
                  Update Location
                </Text>
                <TextInput
                  style={[styles.editInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
                  placeholder="Enter new location..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={editLocationValue}
                  onChangeText={setEditLocationValue}
                />
                <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                  <TouchableOpacity 
                    style={{ flex: 1, padding: 10, alignItems: 'center' }}
                    onPress={() => setShowEditLocation(false)}
                  >
                    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                    onPress={async () => {
                      if (!editLocationValue.trim()) {
                        Alert.alert('Error', 'Please enter a location');
                        return;
                      }
                      try {
                        await updateClaimDetailsAsync({
                          matchId: matchId!,
                          data: { returnLocationName: editLocationValue }
                        });
                        Alert.alert('Success', 'Location updated successfully');
                        setShowEditLocation(false);
                        refetch();
                      } catch (err: any) {
                        Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to update location');
                      }
                    }}
                    disabled={isUpdatingClaimDetails}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600' }}>
                      {isUpdatingClaimDetails ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {match.notifiedAt && (
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.success} />
                <Text style={[theme.typography.body, { color: theme.colors.success, marginLeft: 12 }]}>
                  Dropped off: {new Date(match.notifiedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </Card>

          {/* Item Details */}
          <Card style={styles.section}>
            <Text style={[theme.typography.h3, { color: theme.colors.text, marginBottom: 16, fontSize: 18 }]}>
              Item Claimed
            </Text>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.itemImage} />
            )}
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginTop: 12 }]}>
              {lostItem.title}
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}>
              {lostItem.description}
            </Text>
          </Card>
        </ScrollView>

        {/* Footer Actions */}
        {finderState !== 'completed' && (
          <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
            {finderState === 'scheduling_meetup' ? (
              <Button
                title="View Contact Info"
                onPress={() => router.push(`/scheduling/contact-info?matchId=${matchId}&type=found`)}
                style={{ flex: 1 }}
              />
            ) : finderState === 'needs_dropoff' || finderState === 'awaiting_pickup' ? (
              <Button
                title="View L&F Location"
                onPress={() => router.push(`/scheduling/lost-and-found?matchId=${matchId}&type=found`)}
                style={{ flex: 1 }}
              />
            ) : (finderState === 'needs_preference' || finderState === 'awaiting_resolution') ? (
              <Button
                title="Continue"
                onPress={() => router.push(`/scheduling/preference?matchId=${matchId}&type=found`)}
                style={{ flex: 1 }}
              />
            ) : null}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[theme.typography.h3, { color: theme.colors.text }]}>Review Claim</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Alert Banner */}
        <View style={[styles.alertBanner, { backgroundColor: theme.colors.warning + '20' }]}>
          <Ionicons name="hand-left" size={24} color={theme.colors.warning} />
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginLeft: 12, flex: 1 }]}>
            Someone is claiming the item you found!
          </Text>
        </View>

        {/* Someone claimed - identity hidden */}
        <Card style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="person-circle-outline" size={40} color={theme.colors.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>
                Someone claimed this item
              </Text>
              <Text style={[theme.typography.small, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                Identity protected until return method is confirmed
              </Text>
            </View>
          </View>
        </Card>

        {/* Lost Item Details */}
        <Card style={styles.section}>
          <Text style={[theme.typography.h3, { color: theme.colors.text, marginBottom: 16, fontSize: 18 }]}>
            Their Lost Item
          </Text>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.itemImage} />
          )}
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginTop: 12 }]}>
            {lostItem.title}
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}>
            {lostItem.description}
          </Text>
          <View style={[styles.infoRow, { marginTop: 16 }]}>
            <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[theme.typography.small, { color: theme.colors.textSecondary, marginLeft: 8 }]}>
              Lost at: {formatLocation(lostItem.location)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[theme.typography.small, { color: theme.colors.textSecondary, marginLeft: 8 }]}>
              Lost on: {new Date(lostItem.timestamp).toLocaleDateString()}
            </Text>
          </View>
        </Card>

        {/* Return Preference */}
        <Card style={styles.section}>
          <Text style={[theme.typography.h3, { color: theme.colors.text, marginBottom: 12, fontSize: 18 }]}>
            Their Return Preference
          </Text>
          <View style={[styles.preferenceTag, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons 
              name={match.lostUserPreference === 'in_person' ? 'people-outline' : 
                    match.lostUserPreference === 'local_lost_and_found' ? 'business-outline' : 'hand-left-outline'} 
              size={20} 
              color={theme.colors.primary} 
            />
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.primary, marginLeft: 8 }]}>
              {formatPreference(match.lostUserPreference)}
            </Text>
          </View>
        </Card>

        {/* Match Confidence */}
        <Card style={styles.section}>
          <Text style={[theme.typography.h3, { color: theme.colors.text, marginBottom: 12, fontSize: 18 }]}>
            Match Confidence
          </Text>
          <View style={styles.confidenceContainer}>
            <View style={[styles.confidenceBar, { backgroundColor: theme.colors.border }]}>
              <View 
                style={[
                  styles.confidenceFill, 
                  { 
                    backgroundColor: match.confidence >= 70 ? theme.colors.success : 
                                     match.confidence >= 40 ? theme.colors.warning : theme.colors.error,
                    width: `${Math.min(match.confidence, 100)}%` 
                  }
                ]} 
              />
            </View>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>
              {match.confidence.toFixed(0)}%
            </Text>
          </View>
        </Card>

        {/* Decline Options (hidden by default) */}
        {showDeclineOptions && !showProposalForm && (
          <Card style={styles.section}>
            <Text style={[theme.typography.h3, { color: theme.colors.text, marginBottom: 16, fontSize: 18 }]}>
              Why are you declining?
            </Text>
            
            <TouchableOpacity
              style={[styles.declineOption, { borderColor: theme.colors.border }]}
              onPress={handleDeclineWrongPerson}
              disabled={isDeclining}
            >
              <Ionicons name="close-circle-outline" size={24} color={theme.colors.error} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>
                  Wrong Person / Item Mismatch
                </Text>
                <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>
                  This doesn't match what I found
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.declineOption, { borderColor: theme.colors.border }]}
              onPress={() => setShowProposalForm(true)}
            >
              <Ionicons name="swap-horizontal-outline" size={24} color={theme.colors.warning} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>
                  Suggest Different Arrangement
                </Text>
                <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>
                  Propose a different return method
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDeclineOptions(false)}
              style={{ marginTop: 16, alignItems: 'center' }}
            >
              <Text style={[theme.typography.body, { color: theme.colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Proposal Form */}
        {showProposalForm && (
          <Card style={styles.section}>
            <Text style={[theme.typography.h3, { color: theme.colors.text, marginBottom: 16, fontSize: 18 }]}>
              Propose Alternative
            </Text>

            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginBottom: 8 }]}>
              Return Method
            </Text>
            <View style={styles.methodOptions}>
              <TouchableOpacity
                style={[
                  styles.methodOption,
                  { 
                    borderColor: proposedMethod === 'in_person' ? theme.colors.primary : theme.colors.border,
                    backgroundColor: proposedMethod === 'in_person' ? theme.colors.primary + '10' : 'transparent'
                  }
                ]}
                onPress={() => setProposedMethod('in_person')}
              >
                <Ionicons name="people-outline" size={20} color={proposedMethod === 'in_person' ? theme.colors.primary : theme.colors.text} />
                <Text style={[theme.typography.small, { color: theme.colors.text, marginTop: 4 }]}>In-Person</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.methodOption,
                  { 
                    borderColor: proposedMethod === 'local_lost_and_found' ? theme.colors.primary : theme.colors.border,
                    backgroundColor: proposedMethod === 'local_lost_and_found' ? theme.colors.primary + '10' : 'transparent'
                  }
                ]}
                onPress={() => setProposedMethod('local_lost_and_found')}
              >
                <Ionicons name="business-outline" size={20} color={proposedMethod === 'local_lost_and_found' ? theme.colors.primary : theme.colors.text} />
                <Text style={[theme.typography.small, { color: theme.colors.text, marginTop: 4 }]}>Lost & Found</Text>
              </TouchableOpacity>
            </View>

            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginTop: 16, marginBottom: 8 }]}>
              {proposedMethod === 'in_person' ? 'Meeting Location' : 'Lost & Found Location'}
            </Text>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder={proposedMethod === 'in_person' ? "e.g., Library entrance at 3pm" : "e.g., Student Center L&F desk"}
              placeholderTextColor={theme.colors.textTertiary}
              value={proposedLocationName}
              onChangeText={setProposedLocationName}
            />

            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginTop: 16, marginBottom: 8 }]}>
              Message (optional)
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Add a note for the claimant..."
              placeholderTextColor={theme.colors.textTertiary}
              value={declineMessage}
              onChangeText={setDeclineMessage}
              multiline
              numberOfLines={3}
            />

            <View style={styles.proposalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setShowProposalForm(false);
                  setShowDeclineOptions(false);
                }}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}
              >
                <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Button
                title={isProposing ? "Sending..." : "Send Proposal"}
                onPress={handleProposeAlternative}
                disabled={isProposing}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {!showDeclineOptions && !showProposalForm && (
        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.declineButton, { borderColor: theme.colors.error }]}
            onPress={() => setShowDeclineOptions(true)}
          >
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.error }]}>Decline</Text>
          </TouchableOpacity>
          <Button
            title={isAccepting ? "Accepting..." : "Accept Claim"}
            onPress={handleAccept}
            disabled={isAccepting}
            style={{ flex: 1, marginLeft: 12 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  section: { marginBottom: 16 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  itemImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  preferenceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  declineOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  methodOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  methodOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  proposalButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
  },
  declineButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
});
