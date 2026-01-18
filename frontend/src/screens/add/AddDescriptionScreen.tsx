import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';

interface AddDescriptionScreenProps {
  itemType: 'lost' | 'found';
}

export default function AddDescriptionScreen({ itemType }: AddDescriptionScreenProps) {
  const theme = useAppTheme();
  const params = useLocalSearchParams();
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }
    if (description.trim().length < 20) {
      setError('Please provide a more detailed description (at least 20 characters)');
      return;
    }
    router.push({
      pathname: `/${itemType}/add/photo` as any,
      params: { ...params, description: description.trim() }
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
          Describe the item
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: '66.66%' }]} />
        </View>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Step 4 of 6</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Description Input */}
        <Text style={[theme.typography.label, { color: theme.colors.text, marginBottom: 8 }]}>
          Description
        </Text>
        <Text style={[theme.typography.small, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
          Include details like color, brand, size, distinguishing features, etc.
        </Text>
        <View style={[styles.textAreaWrapper, { borderColor: error ? theme.colors.error : theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <TextInput
            style={[styles.textArea, { color: theme.colors.text }]}
            placeholder="e.g., Black iPhone 15 Pro with a clear case, cracked in the bottom right corner..."
            placeholderTextColor={theme.colors.textTertiary}
            value={description}
            onChangeText={(text) => { setDescription(text); setError(''); }}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>
        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginTop: 8, textAlign: 'right' }]}>
          {description.length} characters
        </Text>

        {error && (
          <Text style={[theme.typography.small, { color: theme.colors.error, marginTop: 8 }]}>{error}</Text>
        )}

        {/* Tips */}
        <View style={[styles.tipsContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[theme.typography.smallMedium, { color: theme.colors.text, marginBottom: 8 }]}>
            💡 Tips for a good description:
          </Text>
          <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>
            • Mention the brand and model{'\n'}
            • Describe the color and condition{'\n'}
            • Note any unique marks or damage{'\n'}
            • Include case or accessory details
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
  progressContainer: { padding: 16, alignItems: 'center' },
  progressBar: { width: '100%', height: 4, borderRadius: 2, marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 2 },
  content: { flex: 1 },
  scrollContent: { padding: 16 },
  textAreaWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 150,
  },
  textArea: { fontSize: 16, lineHeight: 24 },
  tipsContainer: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  footer: { padding: 16, borderTopWidth: 1 },
});
