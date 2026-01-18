import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/theme';
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';
import { LiquidPill } from '../../src/components/common/LiquidPill';
import { useItem, useItems } from '../../src/hooks/useItems';

export default function FoundItemDetail() {
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { item, isLoading } = useItem(id);
  const { deleteItem, isDeleting } = useItems('found');

  const handleDelete = () => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(id);
            router.back();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'returned': return 'returned';
      case 'matched': return 'matched';
      default: return 'found';
    }
  };

  if (isLoading || !item) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Loading...</Text>
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
        <Text style={[theme.typography.h3, { color: theme.colors.text }]}>Item Details</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Image */}
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="image-outline" size={64} color={theme.colors.textTertiary} />
          </View>
        )}

        {/* Status Badge */}
        <View style={styles.statusRow}>
          <LiquidPill label={item.status.toUpperCase()} variant={getStatusVariant(item.status)} />
        </View>

        {/* Name */}
        <Text style={[theme.typography.h2, { color: theme.colors.text, marginTop: 16 }]}>{item.name}</Text>

        {/* Details Card */}
        <Card style={{ marginTop: 24 }}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
            <View style={styles.detailText}>
              <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>Found at</Text>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{item.location}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: theme.colors.borderLight }]}>
            <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
            <View style={styles.detailText}>
              <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>Date & Time</Text>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text }]}>{formatDate(item.timestamp)}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: theme.colors.borderLight }]}>
            <Ionicons name="pricetag-outline" size={20} color={theme.colors.textSecondary} />
            <View style={styles.detailText}>
              <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>Category</Text>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.text, textTransform: 'capitalize' }]}>{item.category}</Text>
            </View>
          </View>
        </Card>

        {/* Description */}
        <Card style={{ marginTop: 16 }}>
          <Text style={[theme.typography.label, { color: theme.colors.text, marginBottom: 8 }]}>Description</Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 24 }]}>
            {item.description}
          </Text>
        </Card>
      </ScrollView>

      {/* Footer */}
      {item.status === 'matched' && (
        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <Button
            title="Schedule Handoff"
            onPress={() => router.push(`/scheduling/preference?itemId=${id}&type=found` as any)}
          />
        </View>
      )}
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
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  detailText: { marginLeft: 12, flex: 1 },
  footer: { padding: 16, borderTopWidth: 1 },
});
