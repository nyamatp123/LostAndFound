import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useMatches, useMatchStatus } from '../../hooks/useMatches';

export default function InPersonSchedulingScreen() {
  const theme = useAppTheme();
  const { matchId, type } = useLocalSearchParams<{ matchId: string; type: string }>();
  const { updatePreferenceAsync, isUpdatingPreference, completeReturnAsync, isCompleting } = useMatches();
  const { matchStatus } = useMatchStatus(matchId);
  
  const [date, setDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleConfirm = async () => {
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a meeting location');
      return;
    }

    setIsConfirmed(true);
    // In-person scheduling is set - in a production app, you'd store the meeting details
    // For now, show success and let users coordinate manually
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
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to complete return');
            }
          }
        }
      ]
    );
  };

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const otherPartyLabel = type === 'lost' ? 'finder' : 'owner';

  // Show success/scheduling confirmation view
  if (isConfirmed) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.content, styles.centered]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
          </View>

          <Text style={[theme.typography.h2, { color: theme.colors.text, textAlign: 'center', marginTop: 24 }]}>
            Meeting Scheduled!
          </Text>

          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 12, paddingHorizontal: 24, lineHeight: 24 }]}>
            Coordinate with the {otherPartyLabel} to meet at your scheduled time and location.
          </Text>

          <Card style={{ marginTop: 32, width: '100%' }}>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginBottom: 12 }]}>Meeting Details</Text>
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
              <Text style={[theme.typography.body, { color: theme.colors.text, marginLeft: 8 }]}>
                {formatDate(date)} at {formatTime(date)}
              </Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 8 }]}>
              <Ionicons name="location-outline" size={18} color={theme.colors.textSecondary} />
              <Text style={[theme.typography.body, { color: theme.colors.text, marginLeft: 8 }]}>{location}</Text>
            </View>
            {notes && (
              <View style={[styles.summaryRow, { marginTop: 8 }]}>
                <Ionicons name="document-text-outline" size={18} color={theme.colors.textSecondary} />
                <Text style={[theme.typography.body, { color: theme.colors.text, marginLeft: 8 }]}>{notes}</Text>
              </View>
            )}
          </Card>
        </View>

        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <Button 
            title={isCompleting ? "Completing..." : "Mark as Returned"} 
            onPress={handleCompleteReturn}
            disabled={isCompleting}
          />
          <TouchableOpacity 
            style={{ marginTop: 12, alignItems: 'center' }}
            onPress={() => router.replace(`/(tabs)/${type}` as any)}
          >
            <Text style={[theme.typography.body, { color: theme.colors.primary }]}>I'll do this later</Text>
          </TouchableOpacity>
        </View>
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
        <Text style={[theme.typography.h3, { color: theme.colors.text }]}>In-Person Meeting</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
          Schedule a meetup
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}>
          Choose a time and place to meet the {otherPartyLabel}
        </Text>

        {/* Date Picker */}
        <Text style={[theme.typography.label, { color: theme.colors.text, marginTop: 32, marginBottom: 8 }]}>
          Date & Time
        </Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={[styles.dateTimeButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.colors.text} />
            <Text style={[theme.typography.body, { color: theme.colors.text, marginLeft: 8 }]}>{formatDate(date)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateTimeButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color={theme.colors.text} />
            <Text style={[theme.typography.body, { color: theme.colors.text, marginLeft: 8 }]}>{formatTime(date)}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker value={date} mode="date" minimumDate={new Date()} onChange={handleDateChange} />
        )}
        {showTimePicker && (
          <DateTimePicker value={date} mode="time" onChange={handleTimeChange} />
        )}

        {/* Location */}
        <Text style={[theme.typography.label, { color: theme.colors.text, marginTop: 24, marginBottom: 8 }]}>
          Meeting Location
        </Text>
        <View style={[styles.inputWrapper, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="e.g., Student Union lobby"
            placeholderTextColor={theme.colors.textTertiary}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Notes */}
        <Text style={[theme.typography.label, { color: theme.colors.text, marginTop: 24, marginBottom: 8 }]}>
          Notes (Optional)
        </Text>
        <View style={[styles.textAreaWrapper, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <TextInput
            style={[styles.textArea, { color: theme.colors.text }]}
            placeholder="Any additional details..."
            placeholderTextColor={theme.colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Summary */}
        <Card style={{ marginTop: 32 }}>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginBottom: 12 }]}>Summary</Text>
          <View style={styles.summaryRow}>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={[theme.typography.body, { color: theme.colors.text, marginLeft: 8 }]}>
              {formatDate(date)} at {formatTime(date)}
            </Text>
          </View>
          {location && (
            <View style={[styles.summaryRow, { marginTop: 8 }]}>
              <Ionicons name="location-outline" size={18} color={theme.colors.textSecondary} />
              <Text style={[theme.typography.body, { color: theme.colors.text, marginLeft: 8 }]}>{location}</Text>
            </View>
          )}
        </Card>

        {/* Safety Tips */}
        <Card style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.success} />
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, marginLeft: 8 }]}>Safety Tips</Text>
          </View>
          <Text style={[theme.typography.small, { color: theme.colors.textSecondary, lineHeight: 20 }]}>
            • Meet in a public, well-lit area{'\n'}
            • Consider bringing a friend{'\n'}
            • Verify the item before completing the exchange
          </Text>
        </Card>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Button title="Confirm Meeting" onPress={handleConfirm} disabled={!location.trim()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
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
  scrollContent: { flex: 1 },
  scrollContentContainer: { padding: 16 },
  dateTimeRow: { flexDirection: 'row', gap: 12 },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: { flex: 1, fontSize: 16, marginLeft: 8 },
  textAreaWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
  },
  textArea: { fontSize: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  footer: { padding: 16, borderTopWidth: 1 },
});
