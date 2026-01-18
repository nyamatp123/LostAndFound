import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Card } from '../common/Card';

/**
 * LocationPicker Component
 *
 * TODO: CARTES.IO INTEGRATION PLACEHOLDER
 *
 * This component is a placeholder for the Cartes.io map integration.
 * When integrating Cartes.io, replace the placeholder UI below with:
 *
 * 1. Import the Cartes.io SDK/library
 * 2. Initialize the map with your Cartes.io API key
 * 3. Display an interactive map view
 * 4. Allow users to:
 *    - Pan and zoom the map
 *    - Drop a pin at their desired location
 *    - Search for locations by address
 *    - Get coordinates (latitude, longitude) from selected location
 *
 * INTEGRATION POINTS:
 * - Replace <View style={styles.mapPlaceholder}> with Cartes.io map component
 * - Connect onLocationSelect callback to map pin selection
 * - Pass initial location if editing an existing item
 * - Support both address string and coordinate pair
 *
 * REQUIRED PROPS TO MAINTAIN:
 * @param onLocationSelect - Callback when user selects a location
 * @param initialLocation - Optional initial location to show on map
 * @param initialCoords - Optional initial coordinates
 */

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    coords?: { latitude: number; longitude: number };
  }) => void;
  initialLocation?: string;
  initialCoords?: { latitude: number; longitude: number };
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation = '',
  initialCoords,
}) => {
  const theme = useAppTheme();
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);

  // TODO: Remove this placeholder text input once Cartes.io is integrated
  const handleLocationChange = (text: string) => {
    setSelectedLocation(text);
  };

  const handleConfirm = () => {
    // TODO: Replace with actual coordinates from Cartes.io map
    onLocationSelect({
      address: selectedLocation,
      coords: initialCoords, // Placeholder - should come from map
    });
  };

  return (
    <View style={styles.container}>
      {/* TODO: REPLACE THIS ENTIRE SECTION WITH CARTES.IO MAP COMPONENT */}
      <Card variant="elevated" style={styles.mapContainer}>
        <View
          style={[
            styles.mapPlaceholder,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Ionicons
            name="map-outline"
            size={48}
            color={theme.colors.textTertiary}
          />
          <Text
            style={[
              styles.placeholderText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Cartes.io Map Integration
          </Text>
          <Text
            style={[
              styles.placeholderSubtext,
              { color: theme.colors.textTertiary },
            ]}
          >
            Interactive map will appear here
          </Text>

          {/* Placeholder coordinates display */}
          {initialCoords && (
            <Text
              style={[
                styles.coordsText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {initialCoords.latitude.toFixed(6)},{' '}
              {initialCoords.longitude.toFixed(6)}
            </Text>
          )}
        </View>
      </Card>

      {/* TODO: This text input is temporary - remove once map is integrated */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          Location (Text Input - Temporary)
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          value={selectedLocation}
          onChangeText={handleLocationChange}
          placeholder="Enter location address..."
          placeholderTextColor={theme.colors.textTertiary}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.md,
          },
        ]}
        onPress={handleConfirm}
      >
        <Text
          style={[
            styles.confirmButtonText,
            { color: theme.isDark ? theme.colors.background : '#FFFFFF' },
          ]}
        >
          Confirm Location
        </Text>
      </TouchableOpacity>

      {/* Integration instructions */}
      <Card style={[styles.infoCard, { marginTop: theme.spacing.md }]}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
          📍 Cartes.io Integration Required
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          See LocationPicker.tsx for integration instructions
        </Text>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    height: 300,
    padding: 0,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  coordsText: {
    fontSize: 12,
    marginTop: 16,
    fontFamily: 'monospace',
  },
  inputContainer: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  confirmButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
  },
});
