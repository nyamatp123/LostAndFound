import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useAppTheme } from '../../theme';

interface LocationPickerProps {
  onLocationSelect: (location: { address: string; coords?: { latitude: number; longitude: number } }) => void;
  initialLocation?: string;
}

/**
 * LocationPicker Component
 * 
 * TODO: Integrate Cartes.io map API here
 * 
 * This component is a placeholder for the map-based location picker.
 * When Cartes.io integration is ready:
 * 1. Replace the placeholder View with the actual map component
 * 2. Add marker placement functionality
 * 3. Implement reverse geocoding for address display
 * 4. Add search/autocomplete for locations
 */
export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
}) => {
  const theme = useAppTheme();
  const { width } = Dimensions.get('window');

  // Placeholder locations for testing
  const placeholderLocations = [
    { address: 'Main Library, UBC', coords: { latitude: 49.2678, longitude: -123.2535 } },
    { address: 'Student Union Building, UBC', coords: { latitude: 49.2688, longitude: -123.2500 } },
    { address: 'Koerner Library, UBC', coords: { latitude: 49.2668, longitude: -123.2556 } },
    { address: 'Irving K. Barber Learning Centre', coords: { latitude: 49.2676, longitude: -123.2520 } },
  ];

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View
        style={[
          styles.mapPlaceholder,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            width: width - 48,
            height: 200,
          },
        ]}
      >
        <Text style={[theme.typography.body, { color: theme.colors.textTertiary }]}>
          🗺️ Map Integration Coming Soon
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginTop: 8 }]}>
          Cartes.io will be integrated here
        </Text>
      </View>

      {/* Quick Location Selection */}
      <Text
        style={[
          theme.typography.smallMedium,
          { color: theme.colors.text, marginTop: 16, marginBottom: 8 },
        ]}
      >
        Or select a location:
      </Text>

      {placeholderLocations.map((location, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.locationOption,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.md,
            },
          ]}
          onPress={() => onLocationSelect(location)}
        >
          <Text style={[theme.typography.body, { color: theme.colors.text }]}>
            📍 {location.address}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapPlaceholder: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationOption: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
});
