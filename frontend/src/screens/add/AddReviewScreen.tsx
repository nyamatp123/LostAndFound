import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useItems } from '../../hooks/useItems';

interface AddReviewScreenProps {
  itemType: 'lost' | 'found';
}

export default function AddReviewScreen({ itemType }: AddReviewScreenProps) {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{
    latitude: string;
    longitude: string;
    timestamp: string;
    name: string;
    category: string;
    description: string;
    imageUri: string;
    imageBase64: string;
  }>();
  
  const { createItemAsync, isCreating } = useItems(itemType);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    try {
      const latitude = parseFloat(params.latitude || '0');
      const longitude = parseFloat(params.longitude || '0');
      
      // Use the base64 image passed from AddPhotoScreen
      const images: string[] = params.imageBase64 ? [params.imageBase64] : [];
      
      await createItemAsync({
        type: itemType,
        title: params.name || '',
        category: params.category || '',
        description: params.description || '',
        location: JSON.stringify({ latitude, longitude }),
        coordinates: { latitude, longitude },
        timestamp: params.timestamp || new Date().toISOString(),
        images,
      });
      setSubmitted(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create item');
    }
  };

  const handleDone = () => {
    router.replace(`/(tabs)/${itemType}` as any);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (submitted) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.successIcon, { backgroundColor: theme.colors.success + '20' }]}>
          <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
        </View>
        <Text style={[theme.typography.h2, { color: theme.colors.text, marginTop: 24 }]}>
          Item {itemType === 'lost' ? 'Reported' : 'Submitted'}!
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }]}>
          {itemType === 'lost'
            ? "We'll notify you when someone finds a matching item."
            : "We'll notify you if someone is looking for this item."}
        </Text>
        <Button title="Done" onPress={handleDone} style={{ marginTop: 32, minWidth: 200 }} />
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
        <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
          Review
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: '100%' }]} />
        </View>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Step 6 of 6</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Image Preview */}
        {params.imageUri ? (
          <Image source={{ uri: params.imageUri }} style={styles.previewImage} />
        ) : (
          <View style={[styles.noImage, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="image-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={[theme.typography.small, { color: theme.colors.textTertiary, marginTop: 8 }]}>
              No photo added
            </Text>
          </View>
        )}

        {/* Details Card */}
        <Card style={{ marginTop: 16 }}>
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={20} color={theme.colors.textSecondary} />
            <View style={styles.detailText}>
              <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>Item</Text>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{params.name}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: theme.colors.borderLight }]}>
            <Ionicons name="pricetag-outline" size={20} color={theme.colors.textSecondary} />
            <View style={styles.detailText}>
              <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>Category</Text>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, textTransform: 'capitalize' }]}>{params.category}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: theme.colors.borderLight }]}>
            <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
            <View style={styles.detailText}>
              <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>Location</Text>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>
                {params.latitude && params.longitude
                  ? `${parseFloat(params.latitude).toFixed(4)}, ${parseFloat(params.longitude).toFixed(4)}`
                  : 'Not specified'}
              </Text>
            </View>
          </View>

          <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: theme.colors.borderLight }]}>
            <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
            <View style={styles.detailText}>
              <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>Date & Time</Text>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{formatDate(params.timestamp || '')}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: theme.colors.borderLight }]}>
            <Ionicons name="document-text-outline" size={20} color={theme.colors.textSecondary} />
            <View style={styles.detailText}>
              <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>Description</Text>
              <Text style={[theme.typography.body, { color: theme.colors.text, marginTop: 4 }]}>{params.description}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Button
          title={itemType === 'lost' ? 'Report Lost Item' : 'Submit Found Item'}
          onPress={handleSubmit}
          loading={isCreating}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
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
  previewImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
  },
  noImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  detailText: { marginLeft: 12, flex: 1 },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: { padding: 16, borderTopWidth: 1 },
});
