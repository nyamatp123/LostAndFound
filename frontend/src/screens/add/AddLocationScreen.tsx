import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { LocationPicker } from '../../components/maps/LocationPicker';

interface AddLocationScreenProps {
  itemType: 'lost' | 'found';
}

export default function AddLocationScreen({ itemType }: AddLocationScreenProps) {
  const theme = useAppTheme();
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState('');

  const handleLocationSelect = (coords: { latitude: number; longitude: number }) => {
    setCoordinates(coords);
    setError('');
  };

  const handleNext = () => {
    if (!coordinates) {
      setError('Please select a location on the map');
      return;
    }
    // Store coordinates in route params and navigate to next step
    router.push({
      pathname: `/${itemType}/add/timestamp` as any,
      params: { 
        latitude: coordinates.latitude.toString(),
        longitude: coordinates.longitude.toString()
      }
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
          Where did you {itemType === 'lost' ? 'lose' : 'find'} it?
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: '16.66%' }]} />
        </View>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Step 1 of 6</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Map Location Picker */}
        <LocationPicker
          onLocationSelect={handleLocationSelect}
          initialCoords={coordinates || undefined}
        />
        
        {error && (
          <Text style={[theme.typography.small, { color: theme.colors.error, marginTop: 12, textAlign: 'center' }]}>
            {error}
          </Text>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Button title="Next" onPress={handleNext} />
      </View>
    </KeyboardAvoidingView>
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
  progressContainer: {
    padding: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: { flex: 1 },
  scrollContent: { padding: 16 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});
