"use client"

import { useState } from "react"
import { StyleSheet, ScrollView, Switch } from "react-native"
import { Text, List, Divider, Button, Dialog, Portal, TextInput } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useMutation } from "@tanstack/react-query"
import { updateSettings } from "../api/settingsApi"

const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    darkMode: false,
    autoRefresh: true,
    refreshInterval: "24",
    notificationsEnabled: true,
    downloadChapters: false,
    maxDownloads: "50",
  })

  const [dialogVisible, setDialogVisible] = useState(false)
  const [dialogType, setDialogType] = useState("")
  const [dialogValue, setDialogValue] = useState("")

  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      // Handle success
    },
  })

  const showDialog = (type, value) => {
    setDialogType(type)
    setDialogValue(value)
    setDialogVisible(true)
  }

  const saveDialogValue = () => {
    if (dialogType === "refreshInterval") {
      setSettings({ ...settings, refreshInterval: dialogValue })
    } else if (dialogType === "maxDownloads") {
      setSettings({ ...settings, maxDownloads: dialogValue })
    }
    setDialogVisible(false)
  }

  const toggleSetting = (setting) => {
    setSettings({ ...settings, [setting]: !settings[setting] })
  }

  const saveSettings = () => {
    updateSettingsMutation.mutate(settings)
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Settings
      </Text>

      <ScrollView>
        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="Dark Mode"
            description="Enable dark theme for the app"
            right={() => (
              <Switch value={settings.darkMode} onValueChange={() => toggleSetting("darkMode")} color="#6200ee" />
            )}
          />
          <Divider />

          <List.Subheader>Content Updates</List.Subheader>
          <List.Item
            title="Auto Refresh"
            description="Automatically check for new chapters"
            right={() => (
              <Switch value={settings.autoRefresh} onValueChange={() => toggleSetting("autoRefresh")} color="#6200ee" />
            )}
          />
          <List.Item
            title="Refresh Interval"
            description={`Check every ${settings.refreshInterval} hours`}
            onPress={() => showDialog("refreshInterval", settings.refreshInterval)}
          />
          <List.Item
            title="Notifications"
            description="Get notified when new chapters are available"
            right={() => (
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={() => toggleSetting("notificationsEnabled")}
                color="#6200ee"
              />
            )}
          />
          <Divider />

          <List.Subheader>Storage</List.Subheader>
          <List.Item
            title="Download Chapters"
            description="Save chapters for offline reading"
            right={() => (
              <Switch
                value={settings.downloadChapters}
                onValueChange={() => toggleSetting("downloadChapters")}
                color="#6200ee"
              />
            )}
          />
          <List.Item
            title="Maximum Downloads"
            description={`Store up to ${settings.maxDownloads} chapters`}
            onPress={() => showDialog("maxDownloads", settings.maxDownloads)}
          />
          <List.Item
            title="Clear Cache"
            description="Remove all downloaded content"
            onPress={() => {
              /* Show confirmation dialog */
            }}
          />
        </List.Section>
      </ScrollView>

      <Button
        mode="contained"
        onPress={saveSettings}
        style={styles.saveButton}
        loading={updateSettingsMutation.isPending}
      >
        Save Settings
      </Button>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{dialogType === "refreshInterval" ? "Refresh Interval" : "Maximum Downloads"}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={dialogType === "refreshInterval" ? "Hours" : "Chapters"}
              value={dialogValue}
              onChangeText={setDialogValue}
              keyboardType="numeric"
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={saveDialogValue}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: "bold",
  },
  saveButton: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: "#6200ee",
  },
})

export default SettingsScreen
