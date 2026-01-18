import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { useMatchStatus } from '../../hooks/useMatches';

export default function SchedulingWaitingScreen() {
  const theme = useAppTheme();
  const { matchId, type } = useLocalSearchParams<{ matchId: string; type: string }>();
  
  // Poll the match status every 5 seconds
  const { matchStatus, isLoading, error } = useMatchStatus(matchId, true);

  // Effect to handle navigation when both parties have submitted
  useEffect(() => {
    if (!matchStatus) return;

    if (matchStatus.isResolved && matchStatus.resolvedReturnMethod) {
      // Both parties have submitted, navigate based on resolved method
      if (matchStatus.resolvedReturnMethod === 'local_lost_and_found') {
        router.replace({
          pathname: '/scheduling/lost-and-found' as any,
          params: { matchId, type: matchStatus.userRole }
        });
      } else if (matchStatus.resolvedReturnMethod === 'in_person') {
        // Navigate to contact info screen (no scheduling in app)
        router.replace({
          pathname: '/scheduling/contact-info' as any,
          params: { matchId, type: matchStatus.userRole }
        });
      }
    }
  }, [matchStatus, matchId]);

  const handleDone = () => {
    // Go back to the appropriate tab
    router.replace(`/(tabs)/${type}` as any);
  };

  if (isLoading && !matchStatus) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 16 }]}>
          Loading...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
        <Text style={[theme.typography.h3, { color: theme.colors.text, marginTop: 16 }]}>
          Something went wrong
        </Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 24 }} />
      </View>
    );
  }

  // Check if this user has submitted but waiting for other party
  const userHasSubmitted = matchStatus?.userRole === 'lost' 
    ? !!matchStatus?.lostUserPreference 
    : !!matchStatus?.foundUserPreference;

  const otherPartyLabel = matchStatus?.userRole === 'lost' ? 'finder' : 'owner';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Waiting Icon */}
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>

        {/* Title */}
        <Text style={[theme.typography.h2, { color: theme.colors.text, textAlign: 'center', marginTop: 32 }]}>
          Waiting for {otherPartyLabel}
        </Text>

        {/* Message */}
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 16, paddingHorizontal: 24, lineHeight: 24 }]}>
          You've submitted your preference! We're waiting for the {otherPartyLabel} to submit theirs.
          {'\n\n'}
          We'll notify you once both preferences are in and the return method is determined.
        </Text>

        {/* What's Next Card */}
        <View style={[styles.nextCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginBottom: 16 }]}>
            What happens next?
          </Text>
          
          <View style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, flex: 1 }]}>
              You've submitted your preference
            </Text>
          </View>

          <View style={[styles.stepRow, { marginTop: 12 }]}>
            <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
              <Text style={[theme.typography.smallMedium, { color: '#fff' }]}>2</Text>
            </View>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, flex: 1 }]}>
              Waiting for {otherPartyLabel}'s preference
            </Text>
          </View>

          <View style={[styles.stepRow, { marginTop: 12 }]}>
            <View style={[styles.stepNumber, { backgroundColor: theme.colors.border }]}>
              <Text style={[theme.typography.smallMedium, { color: theme.colors.text }]}>3</Text>
            </View>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, flex: 1 }]}>
              Return method will be determined automatically
            </Text>
          </View>
        </View>

        {/* Status indicator */}
        <View style={[styles.statusPill, { backgroundColor: theme.colors.primary + '15' }]}>
          <View style={[styles.pulsingDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={[theme.typography.small, { color: theme.colors.primary, marginLeft: 8 }]}>
            Checking for updates...
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Button 
          title="I'll come back later" 
          onPress={handleDone}
          variant="secondary"
        />
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextCard: {
    width: '100%',
    marginTop: 40,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 24,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: { padding: 16, borderTopWidth: 1 },
});
