import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';

const CATEGORIES = [
  { id: 'electronics', label: 'Electronics', icon: 'phone-portrait-outline' },
  { id: 'clothing', label: 'Clothing', icon: 'shirt-outline' },
  { id: 'accessories', label: 'Accessories', icon: 'watch-outline' },
  { id: 'documents', label: 'Documents', icon: 'document-text-outline' },
  { id: 'keys', label: 'Keys', icon: 'key-outline' },
  { id: 'bags', label: 'Bags', icon: 'briefcase-outline' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet-outline' },
  { id: 'other', label: 'Other', icon: 'cube-outline' },
];

interface AddNameScreenProps {
  itemType: 'lost' | 'found';
}

export default function AddNameScreen({ itemType }: AddNameScreenProps) {
  const theme = useAppTheme();
  const params = useLocalSearchParams();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!name.trim()) {
      setError('Please enter an item name');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }
    router.push({
      pathname: `/${itemType}/add/description` as any,
      params: { ...params, name: name.trim(), category }
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
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
          What did you {itemType === 'lost' ? 'lose' : 'find'}?
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: '50%' }]} />
        </View>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Step 3 of 6</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Name Input */}
        <View style={styles.inputContainer}>
          <Text style={[theme.typography.label, { color: theme.colors.text, marginBottom: 8 }]}>
            Item Name
          </Text>
          <View style={[styles.inputWrapper, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="e.g., iPhone 15 Pro"
              placeholderTextColor={theme.colors.textTertiary}
              value={name}
              onChangeText={(text) => { setName(text); setError(''); }}
            />
          </View>
        </View>

        {/* Category Selection */}
        <Text style={[theme.typography.label, { color: theme.colors.text, marginBottom: 12 }]}>
          Category
        </Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryItem,
                {
                  borderColor: category === cat.id ? theme.colors.primary : theme.colors.border,
                  backgroundColor: category === cat.id ? theme.colors.primary + '10' : theme.colors.surface,
                }
              ]}
              onPress={() => { setCategory(cat.id); setError(''); }}
            >
              <Ionicons
                name={cat.icon as any}
                size={24}
                color={category === cat.id ? theme.colors.primary : theme.colors.text}
              />
              <Text
                style={[
                  theme.typography.small,
                  { color: category === cat.id ? theme.colors.primary : theme.colors.text, marginTop: 4 }
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && (
          <Text style={[theme.typography.small, { color: theme.colors.error, marginTop: 16 }]}>{error}</Text>
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
  progressContainer: { padding: 16, alignItems: 'center' },
  progressBar: { width: '100%', height: 4, borderRadius: 2, marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 2 },
  content: { flex: 1 },
  scrollContent: { padding: 16 },
  inputContainer: { marginBottom: 24 },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
  },
  input: { fontSize: 16 },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    width: '22%',
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: { padding: 16, borderTopWidth: 1 },
});
