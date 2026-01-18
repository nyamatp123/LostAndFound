import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface AddTimestampScreenProps {
  itemType: 'lost' | 'found';
}

export default function AddTimestampScreen({ itemType }: AddTimestampScreenProps) {
  const theme = useAppTheme();
  const params = useLocalSearchParams();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleNext = () => {
    router.push({
      pathname: `/${itemType}/add/name` as any,
      params: { ...params, timestamp: date.toISOString() }
    });
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
        <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
          When did you {itemType === 'lost' ? 'lose' : 'find'} it?
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: '33.33%' }]} />
        </View>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Step 2 of 6</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Date Picker */}
        <TouchableOpacity
          style={[styles.pickerButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={24} color={theme.colors.text} />
          <View style={styles.pickerText}>
            <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>Date</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{formatDate(date)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
        </TouchableOpacity>

        {/* Time Picker */}
        <TouchableOpacity
          style={[styles.pickerButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          onPress={() => setShowTimePicker(true)}
        >
          <Ionicons name="time-outline" size={24} color={theme.colors.text} />
          <View style={styles.pickerText}>
            <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>Time</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{formatTime(date)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
        </TouchableOpacity>

        {/* Date/Time Picker Modals */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Button title="Next" onPress={handleNext} />
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
  progressContainer: { padding: 16, alignItems: 'center' },
  progressBar: { width: '100%', height: 4, borderRadius: 2, marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 2 },
  content: { flex: 1 },
  scrollContent: { padding: 16 },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  pickerText: { flex: 1, marginLeft: 16 },
  footer: { padding: 16, borderTopWidth: 1 },
});
