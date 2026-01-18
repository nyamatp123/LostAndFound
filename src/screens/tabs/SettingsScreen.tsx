import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, useTheme } from '../../theme';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const { setTheme } = useTheme();
  const { logout, currentUser } = useAuth();
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    fullName: '',
    email: '',
    city: '',
  });
  const [profileOverrides, setProfileOverrides] = useState<{
    fullName?: string;
    email?: string;
    city?: string;
  }>({});

  const displayedUser = useMemo(
    () => ({
      fullName: profileOverrides.fullName ?? currentUser?.fullName ?? '',
      email: profileOverrides.email ?? currentUser?.email ?? '',
      city: profileOverrides.city ?? currentUser?.city ?? '',
    }),
    [profileOverrides, currentUser]
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  const openProfileEditor = () => {
    setProfileDraft({ fullName: '', email: '', city: '' });
    setIsProfileModalVisible(true);
  };

  const handleSaveProfile = () => {
    const updates: {
      fullName?: string;
      email?: string;
      city?: string;
    } = {};

    if (profileDraft.fullName.trim()) {
      updates.fullName = profileDraft.fullName.trim();
    }

    if (profileDraft.email.trim()) {
      updates.email = profileDraft.email.trim();
    }

    if (profileDraft.city.trim()) {
      updates.city = profileDraft.city.trim();
    }

    if (Object.keys(updates).length > 0) {
      setProfileOverrides((prev) => ({ ...prev, ...updates }));
    }

    setIsProfileModalVisible(false);
  };

  const SettingsRow = ({
    icon,
    title,
    subtitle,
    onPress,
    showChevron = true,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.row,
        {
          borderBottomColor: theme.colors.borderLight,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon as any} size={24} color={theme.colors.text} />
        <View style={styles.rowText}>
          <Text style={[theme.typography.body, { color: theme.colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                theme.typography.small,
                { color: theme.colors.textSecondary, marginTop: 2 },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {showChevron && onPress && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.textTertiary}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
          Settings
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Account Section */}
        <Text
          style={[
            theme.typography.smallMedium,
            {
              color: theme.colors.textSecondary,
              marginLeft: theme.spacing.md,
              marginTop: theme.spacing.lg,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          ACCOUNT
        </Text>
        <Card style={{ marginHorizontal: theme.spacing.md }}>
          <SettingsRow
            icon="person-outline"
            title="Profile"
            subtitle={displayedUser.email || 'View and edit profile'}
            onPress={openProfileEditor}
          />
          <SettingsRow
            icon="key-outline"
            title="Change Password"
            onPress={() => Alert.alert('TODO', 'Change password not implemented yet')}
          />
          <SettingsRow
            icon="log-out-outline"
            title="Logout"
            onPress={handleLogout}
            showChevron={false}
          />
        </Card>

        {/* App Preferences */}
        <Text
          style={[
            theme.typography.smallMedium,
            {
              color: theme.colors.textSecondary,
              marginLeft: theme.spacing.md,
              marginTop: theme.spacing.lg,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          APP PREFERENCES
        </Text>
        <Card style={{ marginHorizontal: theme.spacing.md }}>
          <SettingsRow
            icon={theme.isDark ? 'moon-outline' : 'sunny-outline'}
            title="Theme"
            subtitle={theme.isDark ? 'Dark Mode' : 'Light Mode'}
            onPress={() => {
              Alert.alert('Theme', 'Select theme', [
                { text: 'Light', onPress: () => setTheme('light') },
                { text: 'Dark', onPress: () => setTheme('dark') },
                { text: 'System', onPress: () => setTheme('system') },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          />
        </Card>

        {/* Privacy */}
        <Text
          style={[
            theme.typography.smallMedium,
            {
              color: theme.colors.textSecondary,
              marginLeft: theme.spacing.md,
              marginTop: theme.spacing.lg,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          PRIVACY
        </Text>
        <Card style={{ marginHorizontal: theme.spacing.md }}>
          <SettingsRow
            icon="lock-closed-outline"
            title="Privacy Settings"
            subtitle="Control who can see your information"
            onPress={() => Alert.alert('TODO', 'Privacy settings not implemented yet')}
          />
        </Card>

        {/* Help & Safety */}
        <Text
          style={[
            theme.typography.smallMedium,
            {
              color: theme.colors.textSecondary,
              marginLeft: theme.spacing.md,
              marginTop: theme.spacing.lg,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          HELP & SAFETY
        </Text>
        <Card style={{ marginHorizontal: theme.spacing.md, marginBottom: theme.spacing.xl }}>
          <SettingsRow
            icon="flag-outline"
            title="Report a Problem"
            onPress={() => Alert.alert('TODO', 'Report problem not implemented yet')}
          />
          <SettingsRow
            icon="help-circle-outline"
            title="Help & About"
            onPress={() => Alert.alert('TODO', 'Help & About not implemented yet')}
          />
        </Card>
      </ScrollView>

      <Modal
        visible={isProfileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
              Edit Profile
            </Text>
            <Text
              style={[
                theme.typography.small,
                { color: theme.colors.textSecondary, marginTop: 4 },
              ]}
            >
              Update only the fields you want to change.
            </Text>
            <View style={{ marginTop: theme.spacing.md }}>
              <Input
                label="Name"
                placeholder={displayedUser.fullName || 'Name'}
                value={profileDraft.fullName}
                onChangeText={(value) =>
                  setProfileDraft((prev) => ({ ...prev, fullName: value }))
                }
                autoCapitalize="words"
              />
              <Input
                label="Email"
                placeholder={displayedUser.email || 'Email'}
                value={profileDraft.email}
                onChangeText={(value) =>
                  setProfileDraft((prev) => ({ ...prev, email: value }))
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Location"
                placeholder={
                  displayedUser.city ? displayedUser.city : 'Location Unavailable'
                }
                value={profileDraft.city}
                onChangeText={(value) =>
                  setProfileDraft((prev) => ({ ...prev, city: value }))
                }
              />
            </View>
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setIsProfileModalVisible(false)}
                style={{ flex: 1, marginRight: theme.spacing.sm }}
              />
              <Button
                title="Save"
                onPress={handleSaveProfile}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowText: {
    marginLeft: 12,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
