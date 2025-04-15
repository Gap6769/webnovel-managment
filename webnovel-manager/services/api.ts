import type { ApiResponse } from "@/types"
import { API_BASE_URL, ERROR_MESSAGES, STORAGE_KEYS } from "@/constants"

// Generic API client with error handling
async function client<T>(
  endpoint: string,
  { data, token, headers: customHeaders, ...customConfig }: any = {},
): Promise<ApiResponse<T>> {
  const config = {
    method: data ? "POST" : "GET",
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
      ...customHeaders,
    },
    ...customConfig,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    // Handle network errors
    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED }
      }

      if (response.status === 404) {
        return { success: false, error: ERROR_MESSAGES.NOT_FOUND }
      }

      if (response.status >= 500) {
        return { success: false, error: ERROR_MESSAGES.SERVER_ERROR }
      }

      // Try to get error message from response
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || errorData.error || ERROR_MESSAGES.DEFAULT,
      }
    }

    // Check if response is binary (e.g., EPUB file)
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/epub+zip")) {
      const blob = await response.blob()
      return { success: true, data: blob as T }
    }

    // Parse JSON response for other content types
    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    // Handle fetch errors (network issues, etc.)
    console.error("API Error:", error)
    return { success: false, error: ERROR_MESSAGES.NETWORK_ERROR }
  }
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    return client("/auth/login", { data: { email, password } })
  },
  register: async (username: string, email: string, password: string) => {
    return client("/auth/register", { data: { username, email, password } })
  },
  logout: async () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client("/auth/logout", { token })
  },
  getUser: async () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client("/auth/user", { token })
  },
}

// Novels API
export const novelsAPI = {
  getAll: async () => {
    return client<Novel[]>("/novels")
  },
  getById: async (id: string) => {
    return client<Novel>(`/novels/${id}`)
  },
  create: async (novelData: any) => {
    return client<Novel>("/novels", { data: novelData })
  },
  update: async (id: string, novelData: any) => {
    return client<Novel>(`/novels/${id}`, { method: "PUT", data: novelData })
  },
  delete: async (id: string) => {
    return client<void>(`/novels/${id}`, { method: "DELETE" })
  },
  download: async (
    id: string,
    startChapter?: number,
    endChapter?: number,
    singleChapter?: number
  ) => {
    const params = new URLSearchParams()
    if (startChapter !== undefined) params.append("start_chapter", startChapter.toString())
    if (endChapter !== undefined) params.append("end_chapter", endChapter.toString())
    if (singleChapter !== undefined) params.append("single_chapter", singleChapter.toString())

    return client<Blob>(`/novels/${id}/download?${params.toString()}`, {
      headers: {
        "Accept": "application/epub+zip"
      }
    })
  }
}

// Chapters API
export const chaptersAPI = {
  getByNovelId: async (novelId: number) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client(`/novels/${novelId}/chapters`, { token })
  },
  getById: async (novelId: number, chapterId: number) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client(`/novels/${novelId}/chapters/${chapterId}`, { token })
  },
  markAsRead: async (novelId: number, chapterId: number, read: boolean) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client(`/novels/${novelId}/chapters/${chapterId}/read`, {
      method: "PUT",
      data: { read },
      token,
    })
  },
}

// Sources API
export const sourcesAPI = {
  getAll: async () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client("/sources", { token })
  },
  create: async (sourceData: any) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client("/sources", { data: sourceData, token })
  },
  update: async (id: string, sourceData: any) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client(`/sources/${id}`, {
      method: "PUT",
      data: sourceData,
      token,
    })
  },
  delete: async (id: string) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client(`/sources/${id}`, { method: "DELETE", token })
  },
  scrape: async (sourceId: string, url: string) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client(`/sources/${sourceId}/scrape`, {
      data: { url },
      token,
    })
  },
}

// Settings API
export const settingsAPI = {
  get: async () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client("/settings", { token })
  },
  update: async (settingsData: any) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client("/settings", {
      method: "PUT",
      data: settingsData,
      token,
    })
  },
}

// Scraping Jobs API
export const scrapingJobsAPI = {
  getAll: async () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client("/scraping-jobs", { token })
  },
  getByNovelId: async (novelId: number) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client(`/novels/${novelId}/scraping-jobs`, { token })
  },
  create: async (jobData: any) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client("/scraping-jobs", { data: jobData, token })
  },
  update: async (id: string, jobData: any) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client(`/scraping-jobs/${id}`, {
      method: "PUT",
      data: jobData,
      token,
    })
  },
  delete: async (id: string) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client(`/scraping-jobs/${id}`, { method: "DELETE", token })
  },
  runNow: async (id: string) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return client(`/scraping-jobs/${id}/run`, {
      method: "POST",
      token,
    })
  },
}
