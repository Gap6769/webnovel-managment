import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Switch, Button, useTheme } from 'react-native-paper';
import { useSettings, useUpdateSettings } from '../api/settingsApi';

const SettingsScreen = () => {
  const theme = useTheme();
  const { data: settings, isLoading } = useSettings();
  const { mutate: updateSettings } = useUpdateSettings();

  const [localSettings, setLocalSettings] = useState(settings);

  const handleToggle = (key: keyof typeof settings) => {
    if (!localSettings) return;
    const newSettings = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(newSettings);
    updateSettings(newSettings);
  };

  const handleValueChange = (key: keyof typeof settings, value: any) => {
    if (!localSettings) return;
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    updateSettings(newSettings);
  };

  if (isLoading || !localSettings) {
    return (
      <View style={styles.centered}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <List.Item
          title="Dark Mode"
          description="Enable dark theme"
          right={() => (
            <Switch
              value={localSettings.darkMode}
              onValueChange={() => handleToggle('darkMode')}
            />
          )}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Content Updates</List.Subheader>
        <List.Item
          title="Auto Refresh"
          description="Automatically check for new chapters"
          right={() => (
            <Switch
              value={localSettings.autoRefresh}
              onValueChange={() => handleToggle('autoRefresh')}
            />
          )}
        />
        <List.Item
          title="Refresh Interval"
          description={`Check every ${localSettings.refreshInterval} hours`}
          onPress={() => {
            // Show dialog to change interval
          }}
        />
        <List.Item
          title="Notifications"
          description="Get notified when new chapters are available"
          right={() => (
            <Switch
              value={localSettings.notificationsEnabled}
              onValueChange={() => handleToggle('notificationsEnabled')}
            />
          )}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Storage</List.Subheader>
        <List.Item
          title="Download Chapters"
          description="Save chapters for offline reading"
          right={() => (
            <Switch
              value={localSettings.downloadChapters}
              onValueChange={() => handleToggle('downloadChapters')}
            />
          )}
        />
        <List.Item
          title="Maximum Downloads"
          description={`Store up to ${localSettings.maxDownloads} chapters`}
          onPress={() => {
            // Show dialog to change max downloads
          }}
        />
        <List.Item
          title="Clear Cache"
          description="Remove all downloaded content"
          onPress={() => {
            // Show confirmation dialog
          }}
        />
      </List.Section>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => {
            // Reset to default settings
          }}
          style={styles.resetButton}
        >
          Reset to Defaults
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    padding: 16,
  },
  resetButton: {
    marginTop: 16,
  },
});

export default SettingsScreen; 