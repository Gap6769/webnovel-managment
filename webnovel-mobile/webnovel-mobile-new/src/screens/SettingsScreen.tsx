import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Switch, Divider, List, Surface, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingsState {
  darkMode: boolean;
  autoDownload: boolean;
  notificationsEnabled: boolean;
  keepScreenAwake: boolean;
  compactView: boolean;
}

const SettingsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<SettingsState>({
    darkMode: true,
    autoDownload: false,
    notificationsEnabled: true,
    keepScreenAwake: false,
    compactView: false,
  });

  const toggleSetting = (key: keyof SettingsState) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor="#fff"
          onPress={() => navigation.goBack()}
        />
        <Text variant="headlineMedium" style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <Surface style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <List.Item
            title="Dark Mode"
            description="Use dark theme throughout the app"
            left={props => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={settings.darkMode}
                onValueChange={() => toggleSetting('darkMode')}
                color="#9575cd"
              />
            )}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Compact View"
            description="Show more items in the library view"
            left={props => <List.Icon {...props} icon="view-grid" />}
            right={() => (
              <Switch
                value={settings.compactView}
                onValueChange={() => toggleSetting('compactView')}
                color="#9575cd"
              />
            )}
          />
        </Surface>

        <Surface style={styles.section}>
          <Text style={styles.sectionTitle}>Reading</Text>
          <List.Item
            title="Keep Screen Awake"
            description="Prevent screen from sleeping while reading"
            left={props => <List.Icon {...props} icon="phone-lock" />}
            right={() => (
              <Switch
                value={settings.keepScreenAwake}
                onValueChange={() => toggleSetting('keepScreenAwake')}
                color="#9575cd"
              />
            )}
          />
        </Surface>

        <Surface style={styles.section}>
          <Text style={styles.sectionTitle}>Content</Text>
          <List.Item
            title="Auto Download"
            description="Automatically download new chapters"
            left={props => <List.Icon {...props} icon="download" />}
            right={() => (
              <Switch
                value={settings.autoDownload}
                onValueChange={() => toggleSetting('autoDownload')}
                color="#9575cd"
              />
            )}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Notifications"
            description="Get notified about new chapters"
            left={props => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={() => toggleSetting('notificationsEnabled')}
                color="#9575cd"
              />
            )}
          />
        </Surface>

        <Surface style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <List.Item
            title="Version"
            description="1.0.0"
            left={props => <List.Icon {...props} icon="information" />}
          />
        </Surface>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    color: '#9575cd',
    fontSize: 14,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  divider: {
    backgroundColor: '#404040',
  },
});

export default SettingsScreen; 