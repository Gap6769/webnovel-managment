"use client"

import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { settingsAPI } from "@/services/api"
import { useSettingsStore } from "@/store/useSettingsStore"
import type { AppSettings } from "@/types"

export function useSettings() {
  const queryClient = useQueryClient()
  const {
    settings,
    updateSettings,
    updateScrapingSettings,
    updateStorageSettings,
    resetSettings,
  } = useSettingsStore()

  // Fetch settings
  const { data, isLoading, error } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      // Check if we're in the browser environment
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem("webnovel-manager-auth-token")
        if (!token) return null
        
        const response = await settingsAPI.get()
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch settings")
        }
        return response.data
      }
      return null
    },
    // Only fetch from API if we're in the browser
    enabled: typeof window !== 'undefined',
  })

  // Update settings in store when data is fetched
  useEffect(() => {
    if (data?.settings) {
      updateSettings(data.settings)
    }
  }, [data, updateSettings])

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<AppSettings>) => {
      // Update local state
      updateSettings(newSettings)
      // Update server
      return settingsAPI.update(newSettings)
    },
  })

  // Update scraping settings mutation
  const updateScrapingSettingsMutation = useMutation({
    mutationFn: (scrapingSettings: Partial<AppSettings["scraping"]>) => {
      // Update local state
      updateScrapingSettings(scrapingSettings)
      // Update server
      return settingsAPI.update({ scraping: scrapingSettings })
    },
  })

  // Update storage settings mutation
  const updateStorageSettingsMutation = useMutation({
    mutationFn: (storageSettings: Partial<AppSettings["storage"]>) => {
      // Update local state
      updateStorageSettings(storageSettings)
      // Update server
      return settingsAPI.update({ storage: storageSettings })
    },
  })

  // Reset settings mutation
  const resetSettingsMutation = useMutation({
    mutationFn: () => {
      // Reset local state
      resetSettings()
      // Reset server settings
      return settingsAPI.update(settings)
    },
  })

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateSettingsMutation.mutate,
    updateScrapingSettings: updateScrapingSettingsMutation.mutate,
    updateStorageSettings: updateStorageSettingsMutation.mutate,
    resetSettings: resetSettingsMutation.mutate,
    isUpdating:
      updateSettingsMutation.isPending ||
      updateScrapingSettingsMutation.isPending ||
      updateStorageSettingsMutation.isPending ||
      resetSettingsMutation.isPending,
  }
}
