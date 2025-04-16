export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1` : "http://localhost:8001/api/v1"


export const NOVEL_TYPES = ["manhwa", "webnovel", "both"] as const

export const UPDATE_FREQUENCIES = ["hourly", "daily", "weekly", "manual"] as const

export const DOWNLOAD_FORMATS = ["epub", "pdf", "txt", "html"] as const

export const IMAGE_QUALITIES = ["low", "medium", "high", "original"] as const

export const READER_THEMES = ["light", "dark", "sepia"] as const

export const READER_FONT_FAMILIES = [
  "Merriweather",
  "Roboto",
  "Open Sans",
  "Lora",
  "Source Sans Pro",
  "Noto Sans",
  "Noto Serif",
] as const

export const DEFAULT_SETTINGS = {
  theme: "system",
  language: "en",
  notifications: true,
  autoUpdate: true,
  analytics: false,
  scraping: {
    defaultUpdateFrequency: "daily",
    concurrentScrapes: 2,
    requestDelay: 1000,
    useProxy: false,
    proxyUrl: "",
    userAgentRotation: true,
  },
  storage: {
    location: "",
    downloadFormat: "epub",
    imageQuality: "medium",
    autoDownload: true,
    compressImages: true,
  },
  reader: {
    fontSize: 16,
    fontFamily: "Merriweather",
    lineHeight: 1.5,
    theme: "light",
    pageTurnAnimation: true,
  },
} as const

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "zh", name: "中文" },
] as const

export const STORAGE_KEYS = {
  AUTH_TOKEN: "webnovel-manager-auth-token",
  USER: "webnovel-manager-user",
  SETTINGS: "webnovel-manager-settings",
  READING_PROGRESS: "webnovel-manager-reading-progress",
}

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  UNAUTHORIZED: "You are not authorized to perform this action. Please log in.",
  SERVER_ERROR: "Server error. Please try again later.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  DEFAULT: "Something went wrong. Please try again.",
}
