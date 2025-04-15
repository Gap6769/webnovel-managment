import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AppSettings } from "@/types"
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "@/constants"

interface SettingsStore {
  settings: AppSettings
  updateSettings: (settings: Partial<AppSettings>) => void
  updateScrapingSettings: (settings: Partial<AppSettings["scraping"]>) => void
  updateStorageSettings: (settings: Partial<AppSettings["storage"]>) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      updateScrapingSettings: (scrapingSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            scraping: { ...state.settings.scraping, ...scrapingSettings },
          },
        })),
      updateStorageSettings: (storageSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            storage: { ...state.settings.storage, ...storageSettings },
          },
        })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
    },
  ),
)
