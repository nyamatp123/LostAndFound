import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

const LOCATIONS = [
  { id: 'main', name: 'Main Campus Lost & Found', address: 'Student Services Building, Room 101', hours: 'Mon-Fri 9am-5pm' },
  { id: 'library', name: 'Library Lost & Found', address: 'Main Library, Ground Floor', hours: 'Mon-Sun 8am-10pm' },
  { id: 'student-union', name: 'Student Union Info Desk', address: 'Student Union, 1st Floor', hours: 'Mon-Fri 8am-8pm' },
  { id: 'athletics', name: 'Athletics Center', address: 'Rec Center Front Desk', hours: 'Mon-Sun 6am-11pm' },
];

export default function LostAndFoundSchedulingScreen() {
  const theme = useAppTheme();
  const { itemId, type } = useLocalSearchParams<{ itemId: string; type: string }>();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    router.push({
      pathname: '/scheduling/waiting' as any,
      params: { itemId, type, method: 'lost-and-found', locationId: selectedLocation }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[theme.typography.h3, { color: theme.colors.text }]}>Lost & Found Office</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
          Select a location
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}>
          {type === 'lost'
            ? 'Choose where you would like to pick up your item'
            : 'Choose where you will drop off the item'}
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
            {type === 'lost'
              ? '1. The finder will drop off the item at the selected location\n2. You\'ll receive a notification when it arrives\n3. Bring your ID to claim the item'
              : '1. Drop off the item at the selected location\n2. Provide a description of the owner if possible\n3. The owner will be notified to pick it up'}
          </Text>
        </Card>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Button title="Confirm Location" onPress={handleConfirm} disabled={!selectedLocation} />
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
