import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';

interface AddLocationScreenProps {
  itemType: 'lost' | 'found';
}

export default function AddLocationScreen({ itemType }: AddLocationScreenProps) {
  const theme = useAppTheme();
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }
    // Store in route params and navigate to next step
    router.push({
      pathname: `/${itemType}/add/timestamp` as any,
      params: { location: location.trim() }
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
        {/* Location Input */}
        <View style={styles.inputContainer}>
          <Text style={[theme.typography.label, { color: theme.colors.text, marginBottom: 8 }]}>
            Location
          </Text>
          <View style={[styles.inputWrapper, { borderColor: error ? theme.colors.error : theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="e.g., Library 2nd Floor"
              placeholderTextColor={theme.colors.textTertiary}
              value={location}
              onChangeText={(text) => { setLocation(text); setError(''); }}
            />
          </View>
          {error && (
            <Text style={[theme.typography.small, { color: theme.colors.error, marginTop: 4 }]}>{error}</Text>
          )}
        </View>

        {/* Map Placeholder */}
        <View style={[styles.mapPlaceholder, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Ionicons name="map-outline" size={48} color={theme.colors.textTertiary} />
          <Text style={[theme.typography.body, { color: theme.colors.textTertiary, marginTop: 8 }]}>
            Map integration coming soon
          </Text>
        </View>
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
  inputContainer: { marginBottom: 24 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: { flex: 1, fontSize: 16 },
  mapPlaceholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});
