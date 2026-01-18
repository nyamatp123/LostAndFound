import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../../theme';
import { Button } from '../../components/common/Button';

interface AddPhotoScreenProps {
  itemType: 'lost' | 'found';
}

export default function AddPhotoScreen({ itemType }: AddPhotoScreenProps) {
  const theme = useAppTheme();
  const params = useLocalSearchParams();
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async (useCamera: boolean) => {
    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please allow camera access to take photos');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please allow photo library access');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const showImageOptions = () => {
    Alert.alert('Add Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: () => pickImage(true) },
      { text: 'Choose from Library', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleNext = () => {
    router.push({
      pathname: `/${itemType}/add/review` as any,
      params: { ...params, imageUri: imageUri || '' }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
          Add a photo
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: '83.33%' }]} />
        </View>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Step 5 of 6</Text>
      </View>

      <View style={styles.content}>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 24 }]}>
          A photo helps increase the chances of finding a match
        </Text>

        {/* Photo Area */}
        <TouchableOpacity
          style={[styles.photoArea, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          onPress={showImageOptions}
        >
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
                onPress={() => setImageUri(null)}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera-outline" size={48} color={theme.colors.textTertiary} />
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 16 }]}>
                Tap to add a photo
              </Text>
              <Text style={[theme.typography.small, { color: theme.colors.textTertiary, marginTop: 4 }]}>
                Optional but recommended
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Button title={imageUri ? 'Next' : 'Skip'} onPress={handleNext} />
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
  progressContainer: { padding: 16, alignItems: 'center' },
  progressBar: { width: '100%', height: 4, borderRadius: 2, marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 2 },
  content: { flex: 1, padding: 16, paddingTop: 24 },
  photoArea: {
    aspectRatio: 4 / 3,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: { padding: 16, borderTopWidth: 1 },
});
