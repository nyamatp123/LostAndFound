import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';

export default function SchedulingWaitingScreen() {
  const theme = useAppTheme();
  const { type, method } = useLocalSearchParams<{ itemId: string; type: string; method: string }>();

  const handleDone = () => {
    router.replace(`/(tabs)/${type}` as any);
  };

  const getMessage = () => {
    if (method === 'in-person') {
      return type === 'lost'
        ? "We've notified the finder about your meeting request. You'll receive a confirmation soon."
        : "We've sent your meeting request to the owner. You'll receive a confirmation soon.";
    } else {
      return type === 'lost'
        ? "We've notified the finder to drop off your item. We'll let you know when it arrives."
        : "Thank you! We've recorded your drop-off location. The owner will be notified.";
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.success + '20' }]}>
          <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
        </View>

        {/* Title */}
        <Text style={[theme.typography.h2, { color: theme.colors.text, textAlign: 'center', marginTop: 32 }]}>
          {method === 'in-person' ? 'Meeting Scheduled!' : 'Location Confirmed!'}
        </Text>

        {/* Message */}
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 16, paddingHorizontal: 24, lineHeight: 24 }]}>
          {getMessage()}
        </Text>

        {/* What's Next Card */}
        <View style={[styles.nextCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginBottom: 16 }]}>
            What happens next?
          </Text>
          
          <View style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
              <Text style={[theme.typography.smallMedium, { color: '#fff' }]}>1</Text>
            </View>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, flex: 1 }]}>
              Wait for confirmation from the other party
            </Text>
          </View>

          <View style={[styles.stepRow, { marginTop: 12 }]}>
            <View style={[styles.stepNumber, { backgroundColor: theme.colors.border }]}>
              <Text style={[theme.typography.smallMedium, { color: theme.colors.text }]}>2</Text>
            </View>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, flex: 1 }]}>
              You'll get a notification when it's time
            </Text>
          </View>

          <View style={[styles.stepRow, { marginTop: 12 }]}>
            <View style={[styles.stepNumber, { backgroundColor: theme.colors.border }]}>
              <Text style={[theme.typography.smallMedium, { color: theme.colors.text }]}>3</Text>
            </View>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, flex: 1 }]}>
              Complete the {type === 'lost' ? 'pickup' : 'handoff'} and mark as returned
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Button title="Done" onPress={handleDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
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
  footer: { padding: 16, borderTopWidth: 1 },
});
