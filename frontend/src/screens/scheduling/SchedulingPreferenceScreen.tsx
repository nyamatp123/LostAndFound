import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useMatches, useMatchStatus } from '../../hooks/useMatches';
import { ReturnMethod } from '../../types';

type PreferenceOption = 'in_person' | 'local_lost_and_found' | 'no_preference';

export default function SchedulingPreferenceScreen() {
  const theme = useAppTheme();
  const { matchId, type } = useLocalSearchParams<{ matchId: string; type: string }>();
  const [selectedMethod, setSelectedMethod] = useState<PreferenceOption | null>(null);
  const { updatePreferenceAsync, isUpdatingPreference } = useMatches();
  const { data: matchStatus, isLoading: isLoadingStatus } = useMatchStatus(matchId || '');

  // Redirect based on current status when component loads
  useEffect(() => {
    if (!matchStatus || isLoadingStatus) return;

    // If the return method is already resolved, redirect to appropriate screen
    if (matchStatus.resolvedReturnMethod) {
      if (matchStatus.resolvedReturnMethod === 'in_person') {
        router.replace({
          pathname: '/scheduling/in-person' as any,
          params: { matchId, type }
        });
      } else if (matchStatus.resolvedReturnMethod === 'local_lost_and_found') {
        router.replace({
          pathname: '/scheduling/lost-and-found' as any,
          params: { matchId, type }
        });
      }
      return;
    }

    // If user has already submitted preference, go to waiting
    const userPreference = type === 'lost' ? matchStatus.ownerPreference : matchStatus.finderPreference;
    if (userPreference) {
      router.replace({
        pathname: '/scheduling/waiting' as any,
        params: { matchId, type }
      });
    }
  }, [matchStatus, isLoadingStatus, matchId, type]);

  const handleContinue = async () => {
    if (!selectedMethod || !matchId) return;

    try {
      await updatePreferenceAsync({
        id: matchId,
        data: {
          preference: selectedMethod as ReturnMethod,
        },
      });

      // Navigate to waiting screen to see if other party has submitted
      router.push({
        pathname: '/scheduling/waiting' as any,
        params: { matchId, type }
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save preference';
      const details = error.response?.data?.details ? `\n\nDetails: ${error.response.data.details}` : '';
      Alert.alert('Error', errorMessage + details);
    }
  };

  const MethodOption = ({
    method,
    title,
    description,
    icon,
  }: {
    method: PreferenceOption;
    title: string;
    description: string;
    icon: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.optionCard,
        {
          borderColor: selectedMethod === method ? theme.colors.primary : theme.colors.border,
          backgroundColor: selectedMethod === method ? theme.colors.primary + '10' : theme.colors.surface,
        }
      ]}
      onPress={() => setSelectedMethod(method)}
    >
      <View style={[styles.optionIcon, { backgroundColor: selectedMethod === method ? theme.colors.primary + '20' : theme.colors.background }]}>
        <Ionicons name={icon as any} size={32} color={selectedMethod === method ? theme.colors.primary : theme.colors.text} />
      </View>
      <View style={styles.optionText}>
        <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[theme.typography.small, { color: theme.colors.textSecondary, marginTop: 4 }]}>{description}</Text>
      </View>
      {selectedMethod === method && (
        <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  // Show loading while checking status to determine if we need to redirect
  if (isLoadingStatus) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[theme.typography.bodyMedium, { color: theme.colors.textSecondary, marginTop: 16 }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[theme.typography.h3, { color: theme.colors.text }]}>Schedule Return</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={[theme.typography.h2, { color: theme.colors.text, textAlign: 'center' }]}>
          How would you like to{'\n'}{type === 'lost' ? 'receive' : 'return'} the item?
        </Text>

        <View style={styles.options}>
          <MethodOption
            method="in_person"
            title="Meet In-Person"
            description="Exchange contact info to coordinate a meetup"
            icon="people-outline"
          />

          <MethodOption
            method="local_lost_and_found"
            title="Lost & Found Office"
            description="Drop off or pick up at a campus Lost & Found location"
            icon="business-outline"
          />

          <MethodOption
            method="no_preference"
            title="I Don't Mind"
            description="Let the other party decide the return method"
            icon="hand-left-outline"
          />
        </View>

        {/* Safety Tips */}
        <Card style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.success} />
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginLeft: 8 }]}>Safety Tips</Text>
          </View>
          <Text style={[theme.typography.small, { color: theme.colors.textSecondary, lineHeight: 20 }]}>
            • Meet in public, well-lit areas{'\n'}
            • Bring a friend if possible{'\n'}
            • Verify the item before completing the exchange{'\n'}
            • Trust your instincts
          </Text>
        </Card>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Button
          title={isUpdatingPreference ? "Saving..." : "Continue"}
          onPress={handleContinue}
          disabled={!selectedMethod || isUpdatingPreference}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  scrollContent: { padding: 16, paddingTop: 32 },
  options: { marginTop: 32, gap: 16 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 16,
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: { flex: 1, marginLeft: 16 },
  footer: { padding: 16, borderTopWidth: 1 },
});
