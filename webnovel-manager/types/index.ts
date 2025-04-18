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

export interface Chapter {
  title: string;
  chapter_number: number;
  chapter_title: string | null;
  url: string;
  read: boolean;
  downloaded: boolean;
}

export interface Novel {
  _id: string;
  title: string;
  author: string | null;
  cover_image_url: string | null;
  description: string | null;
  source_url: string;
  source_name: string;
  tags: string[];
  status: string | null;
  chapters: Chapter[];
  added_at: string;
  last_updated_api: string;
  last_updated_chapters: string | null;
  last_scraped?: string;
  next_update?: string;
  update_schedule?: string;
}

export interface NovelSummary {
  _id: string;
  title: string;
  author: string | null;
  cover_image_url: string | null;
  status: string | null;
  total_chapters: number;
  last_chapter_number: number;
  read_chapters: number;
  downloaded_chapters: number;
  last_updated_chapters: string | null;
  added_at: string;
}

export interface ManhwaImage {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface ManhwaResponse {
  type: string;
  images: ManhwaImage[];
}

export interface NovelDetail {
  _id: string;
  title: string;
  author: string | null;
  cover_image_url: string | null;
  description: string | null;
  source_url: string;
  source_name: string;
  tags: string[];
  status: string | null;
  type: 'novel' | 'manhwa';
  chapters: {
    title: string;
    chapter_number: number;
    chapter_title: string | null;
    url: string;
    read: boolean;
    downloaded: boolean;
  }[];
  added_at: string;
  last_updated_api: string;
  last_updated_chapters: string;
  last_scraped?: string;
  next_update?: string;
  update_schedule?: string;
}

export interface ChapterDownloadResponse {
  success: boolean;
  message: string;
  updated_chapters: number[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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

export type QueryStatus = "idle" | "loading" | "success" | "error"

export interface ChapterListResponse {
  chapters: Chapter[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
