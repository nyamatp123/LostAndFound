import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Modal, TextInput, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, useTheme } from '../../theme';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const { setTheme } = useTheme();
  const { logout, currentUser, deleteAccount } = useAuth();

  // State for settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);
  
  // State for delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      if (deleteAccount) {
        await deleteAccount();
      }
      setShowDeleteModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
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
      style={[styles.row, { borderBottomColor: theme.colors.borderLight }]}
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
            <Text style={[theme.typography.small, { color: theme.colors.textSecondary, marginTop: 2 }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
      )}
    </TouchableOpacity>
  );

  const SettingsToggle = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={[styles.row, { borderBottomColor: theme.colors.borderLight }]}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon as any} size={24} color={theme.colors.text} />
        <View style={styles.rowText}>
          <Text style={[theme.typography.body, { color: theme.colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[theme.typography.small, { color: theme.colors.textSecondary, marginTop: 2 }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.surface}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Account Section */}
        <Text style={[theme.typography.smallMedium, { color: theme.colors.textSecondary, marginLeft: theme.spacing.md, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }]}>
          ACCOUNT
        </Text>
        <Card style={{ marginHorizontal: theme.spacing.md }}>
          <SettingsRow
            icon="person-outline"
            title="Profile"
            subtitle={currentUser?.email || 'View and edit profile'}
            onPress={() => Alert.alert('TODO', 'Profile screen')}
          />
          <SettingsRow
            icon="key-outline"
            title="Change Password"
            onPress={() => Alert.alert('TODO', 'Change password')}
          />
          <SettingsRow
            icon="log-out-outline"
            title="Logout"
            onPress={handleLogout}
            showChevron={false}
          />
        </Card>

        {/* App Preferences */}
        <Text style={[theme.typography.smallMedium, { color: theme.colors.textSecondary, marginLeft: theme.spacing.md, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }]}>
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

        {/* Notifications */}
        <Text style={[theme.typography.smallMedium, { color: theme.colors.textSecondary, marginLeft: theme.spacing.md, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }]}>
          NOTIFICATIONS
        </Text>
        <Card style={{ marginHorizontal: theme.spacing.md }}>
          <SettingsToggle
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive push notifications"
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
          <SettingsToggle
            icon="mail-outline"
            title="Email Notifications"
            subtitle="Receive updates via email"
            value={emailNotifications}
            onValueChange={setEmailNotifications}
          />
          <SettingsToggle
            icon="flash-outline"
            title="Match Alerts"
            subtitle="Get notified when matches are found"
            value={matchAlerts}
            onValueChange={setMatchAlerts}
          />
        </Card>

        {/* Help & Safety */}
        <Text style={[theme.typography.smallMedium, { color: theme.colors.textSecondary, marginLeft: theme.spacing.md, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }]}>
          HELP & SAFETY
        </Text>
        <Card style={{ marginHorizontal: theme.spacing.md }}>
          <SettingsRow
            icon="shield-checkmark-outline"
            title="Safety Tips"
            onPress={() => Alert.alert('Safety Tips', '• Meet in public places\n• Bring a friend\n• Verify the item\n• Trust your instincts')}
          />
          <SettingsRow
            icon="flag-outline"
            title="Report a Problem"
            onPress={() => Linking.openURL('mailto:support@lostandfound.app')}
          />
          <SettingsRow
            icon="help-circle-outline"
            title="Help Center"
            onPress={() => Alert.alert('Help', 'Visit help.lostandfound.app')}
          />
        </Card>

        {/* Danger Zone */}
        <Text style={[theme.typography.smallMedium, { color: theme.colors.error, marginLeft: theme.spacing.md, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }]}>
          DANGER ZONE
        </Text>
        <Card style={{ marginHorizontal: theme.spacing.md, marginBottom: theme.spacing.xl }}>
          <SettingsRow
            icon="trash-outline"
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={() => setShowDeleteModal(true)}
            showChevron={false}
          />
        </Card>

        {/* Version */}
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
          <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
            Lost & Found v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalIcon, { backgroundColor: theme.colors.error + '20' }]}>
              <Ionicons name="warning" size={32} color={theme.colors.error} />
            </View>

            <Text style={[theme.typography.h3, { color: theme.colors.text, textAlign: 'center', marginTop: 16 }]}>
              Delete Account?
            </Text>

            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
              This action is permanent. All your data will be deleted.
            </Text>

            <Text style={[theme.typography.small, { color: theme.colors.text, marginTop: 24, marginBottom: 8 }]}>
              Type "DELETE" to confirm:
            </Text>

            <TextInput
              style={[styles.confirmInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="characters"
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Delete"
                onPress={handleDeleteAccount}
                loading={isDeleting}
                disabled={deleteConfirmText !== 'DELETE'}
                style={{ flex: 1, marginLeft: 8, backgroundColor: theme.colors.error }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, paddingTop: 60, borderBottomWidth: 1 },
  scrollView: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowText: { marginLeft: 12, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', borderRadius: 16, padding: 24, alignItems: 'center' },
  modalIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  confirmInput: { width: '100%', height: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, fontSize: 16, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', marginTop: 24, width: '100%' },
});
