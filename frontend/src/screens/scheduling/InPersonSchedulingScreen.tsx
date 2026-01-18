import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useMatches } from '../../hooks/useMatches';

export default function InPersonSchedulingScreen() {
  const theme = useAppTheme();
  const { itemId, type } = useLocalSearchParams<{ itemId: string; type: string }>();
  const { updateMatchAsync, isUpdatingMatch } = useMatches();
  
  const [date, setDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

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

    try {
      // In a real app, you'd update the match with the scheduling info
      // await updateMatchAsync({ matchId, scheduledTime: date.toISOString(), meetingLocation: location });
      
      router.push({
        pathname: '/scheduling/waiting' as any,
        params: { itemId, type, method: 'in-person' }
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to schedule meeting');
    }
  };

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

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

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
          Schedule a meetup
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}>
          Choose a time and place to meet
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
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Button title="Confirm Meeting" onPress={handleConfirm} loading={isUpdatingMatch} />
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
  scrollContent: { padding: 16 },
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
