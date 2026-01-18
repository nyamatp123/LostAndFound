import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useMatchStatus, useMatches } from '../../hooks/useMatches';

export default function ContactInfoScreen() {
  const theme = useAppTheme();
  const { matchId, type } = useLocalSearchParams<{ matchId: string; type: string }>();
  
  const { matchStatus, isLoading, error } = useMatchStatus(matchId);
  const { completeReturnAsync, isCompleting } = useMatches();

  const handleEmailPress = () => {
    if (matchStatus?.otherPartyContact?.email) {
      Linking.openURL(`mailto:${matchStatus.otherPartyContact.email}`);
    }
  };

  const handlePhonePress = () => {
    if (matchStatus?.otherPartyContact?.phone) {
      Linking.openURL(`tel:${matchStatus.otherPartyContact.phone}`);
    }
  };

  const handleCompleteReturn = async () => {
    if (!matchId) return;

    Alert.alert(
      'Complete Return',
      'Has the item been successfully exchanged?',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            try {
              await completeReturnAsync(matchId);
              Alert.alert(
                'Success!',
                type === 'lost' ? 'Item successfully returned to you!' : 'Thank you for returning the item!',
                [{ text: 'Done', onPress: () => router.replace(`/(tabs)/${type}` as any) }]
              );
            } catch (err: any) {
              const errorMessage = err.response?.data?.error || err.message || 'Failed to complete return';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const handleDone = () => {
    router.replace(`/(tabs)/${type}` as any);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !matchStatus?.otherPartyContact) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
        <Text style={[theme.typography.h3, { color: theme.colors.text, marginTop: 16 }]}>
          Unable to load contact info
        </Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 24 }} />
      </View>
    );
  }

  const otherPartyLabel = type === 'lost' ? 'Finder' : 'Owner';
  const contact = matchStatus.otherPartyContact;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={handleDone}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[theme.typography.h3, { color: theme.colors.text }]}>Contact Info</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.success + '20' }]}>
          <Ionicons name="people" size={48} color={theme.colors.success} />
        </View>

        <Text style={[theme.typography.h2, { color: theme.colors.text, textAlign: 'center', marginTop: 24 }]}>
          In-Person Meetup Arranged
        </Text>

        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 12, paddingHorizontal: 24, lineHeight: 24 }]}>
          Contact the {otherPartyLabel.toLowerCase()} to arrange a time and place to meet.
        </Text>

        {/* Contact Card */}
        <Card style={{ marginTop: 32, width: '100%' }}>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginBottom: 16 }]}>
            {otherPartyLabel}'s Contact Info
          </Text>

          {/* Name */}
          <View style={styles.contactRow}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[theme.typography.body, { color: theme.colors.text, marginLeft: 12 }]}>
              {contact.name}
            </Text>
          </View>

          {/* Email */}
          <TouchableOpacity style={[styles.contactRow, { marginTop: 12 }]} onPress={handleEmailPress}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[theme.typography.body, { color: theme.colors.primary, marginLeft: 12, flex: 1 }]}>
              {contact.email}
            </Text>
            <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
          </TouchableOpacity>

          {/* Phone (if available) */}
          {contact.phone && (
            <TouchableOpacity style={[styles.contactRow, { marginTop: 12 }]} onPress={handlePhonePress}>
              <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[theme.typography.body, { color: theme.colors.primary, marginLeft: 12, flex: 1 }]}>
                {contact.phone}
              </Text>
              <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </Card>

        {/* Safety Tips */}
        <Card style={{ marginTop: 16, width: '100%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.success} />
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginLeft: 8 }]}>Safety Tips</Text>
          </View>
          <Text style={[theme.typography.small, { color: theme.colors.textSecondary, lineHeight: 20 }]}>
            • Meet in a public, well-lit area{'\n'}
            • Bring a friend if possible{'\n'}
            • Verify the item before completing exchange{'\n'}
            • Trust your instincts
          </Text>
        </Card>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Button 
          title={isCompleting ? "Completing..." : "Mark as Returned"} 
          onPress={handleCompleteReturn}
          disabled={isCompleting}
        />
        <TouchableOpacity 
          style={{ marginTop: 12, alignItems: 'center' }}
          onPress={handleDone}
        >
          <Text style={[theme.typography.body, { color: theme.colors.primary }]}>I'll come back later</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: { 
    padding: 16, 
    borderTopWidth: 1 
  },
});
