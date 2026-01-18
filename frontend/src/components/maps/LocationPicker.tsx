import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useAppTheme } from '../../theme';

interface LocationPickerProps {
  onLocationSelect: (location: { latitude: number; longitude: number }) => void;
  initialCoords?: { latitude: number; longitude: number };
}

// Default to UBC campus center
const DEFAULT_COORDS = {
  latitude: 49.2606,
  longitude: -123.246,
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialCoords,
}) => {
  const theme = useAppTheme();
  const { width } = Dimensions.get('window');
  const webViewRef = useRef<WebView>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(
    initialCoords || null
  );
  const [userLocation, setUserLocation] = useState(DEFAULT_COORDS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(coords);
          // If no initial coords, set user's location as selected
          if (!initialCoords) {
            setSelectedLocation(coords);
            onLocationSelect(coords);
          }
        }
      } catch (error) {
        console.log('Error getting location:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelected') {
        const coords = { latitude: data.lat, longitude: data.lng };
        setSelectedLocation(coords);
        onLocationSelect(coords);
      }
    } catch (error) {
      console.log('Error parsing WebView message:', error);
    }
  };

  const getMapHtml = () => {
    const centerLat = initialCoords?.latitude || userLocation.latitude;
    const centerLng = initialCoords?.longitude || userLocation.longitude;
    const markerLat = selectedLocation?.latitude || centerLat;
    const markerLng = selectedLocation?.longitude || centerLng;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
    .leaflet-control-attribution { font-size: 8px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: true
    }).setView([${centerLat}, ${centerLng}], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    let marker = L.marker([${markerLat}, ${markerLng}], {
      draggable: true
    }).addTo(map);

    // Add user location circle
    L.circle([${userLocation.latitude}, ${userLocation.longitude}], {
      color: '#4285F4',
      fillColor: '#4285F4',
      fillOpacity: 0.3,
      radius: 50
    }).addTo(map);

    function sendLocation(lat, lng) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'locationSelected',
        lat: lat,
        lng: lng
      }));
    }

    // Send initial location
    sendLocation(${markerLat}, ${markerLng});

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      sendLocation(e.latlng.lat, e.latlng.lng);
    });

    marker.on('dragend', function(e) {
      const pos = marker.getLatLng();
      sendLocation(pos.lat, pos.lng);
    });
  </script>
</body>
</html>
    `;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { height: 300 }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}>
          Getting your location...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
        Tap on the map or drag the marker to select location
      </Text>
      <View style={[styles.mapContainer, { borderColor: theme.colors.border }]}>
        <WebView
          ref={webViewRef}
          style={[styles.map, { width: width - 32, height: 300 }]}
          source={{ html: getMapHtml() }}
          onMessage={handleMessage}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
      {selectedLocation && (
        <View style={[styles.coordsContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            📍 {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  map: {
    borderRadius: 12,
  },
  coordsContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
