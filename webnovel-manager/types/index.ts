export type User = {
  id: string
  username: string
  email: string
  avatar?: string
  createdAt: string
}

export type AuthState = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export type Novel = {
  id: number
  title: string
  type: "manhwa" | "webnovel"
  description: string
  author: string
  artist?: string
  lastUpdated: string
  coverImage: string
  chapters: number
  source: string
  status: "Ongoing" | "Completed" | "Hiatus" | "Cancelled"
  genres: string[]
  rating?: number
  views?: number
  lastScraped?: string
  nextUpdate?: string
  recentChapters?: Chapter[]
  isInLibrary?: boolean
}

export type Chapter = {
  id: number
  novelId: number
  number: number
  chapter_number: number
  title: string
  date: string
  read: boolean
  content?: string
  images?: string[]
}

export type Source = {
  id: string
  name: string
  baseUrl: string
  type: "manhwa" | "webnovel" | "both"
  selectors?: {
    title: string
    chapters: string
    content: string
    coverImage: string
  }
  updateFrequency: "hourly" | "daily" | "weekly" | "manual"
  isPreset: boolean
}

export type ScrapingJob = {
  id: string
  novelId: number
  frequency: "hourly" | "daily" | "weekly" | "manual"
  lastRun: string | null
  nextRun: string
  status: "active" | "paused" | "failed"
  error?: string
}

export type AppSettings = {
  theme: "light" | "dark" | "system"
  language: string
  notifications: boolean
  autoUpdate: boolean
  analytics: boolean
  scraping: {
    defaultUpdateFrequency: "hourly" | "daily" | "weekly" | "manual"
    concurrentScrapes: number
    requestDelay: number
    useProxy: boolean
    proxyUrl: string
    userAgentRotation: boolean
  }
  storage: {
    location: string
    downloadFormat: "epub" | "pdf" | "txt" | "html"
    imageQuality: "low" | "medium" | "high" | "original"
    autoDownload: boolean
    compressImages: boolean
  }
  reader: {
    fontSize: number
    fontFamily: string
    lineHeight: number
    theme: "light" | "dark" | "sepia"
    pageTurnAnimation: boolean
  }
}

export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type QueryStatus = "idle" | "loading" | "success" | "error"
