import type { Novel, NovelDetail, Chapter, ChapterDownloadResponse, ApiResponse, ChapterListResponse, ManhwaResponse } from "@/types"
import { API_BASE_URL, ERROR_MESSAGES, STORAGE_KEYS } from "@/constants"

// Generic API client with error handling
async function client<T>(
  endpoint: string,
  { data, headers: customHeaders, ...customConfig }: any = {},
): Promise<ApiResponse<T>> {
  const config = {
    method: data ? "POST" : "GET",
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      "Content-Type": "application/json",
      ...customHeaders,
    },
    ...customConfig,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || errorData.error || "An error occurred",
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
    console.error("API Error:", error)
    return { success: false, error: "Network error occurred" }
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
    return client<NovelDetail>(`/novels/${id}`)
  },
  create: async (novelData: any) => {
    return client<Novel>("/novels", { data: novelData })
  },
  update: async (id: string, novelData: any) => {
    return client<NovelDetail>(`/novels/${id}`, { 
      method: "PATCH", 
      data: novelData 
    })
  },
  delete: async (id: string) => {
    return client<void>(`/novels/${id}`, { method: "DELETE" })
  },
  download: async (
    id: string,
    startChapter?: number,
    endChapter?: number,
    singleChapter?: number,
    translate: boolean = false
  ) => {
    const params = new URLSearchParams()
    if (startChapter !== undefined) params.append("start_chapter", startChapter.toString())
    if (endChapter !== undefined) params.append("end_chapter", endChapter.toString())
    if (singleChapter !== undefined) params.append("single_chapter", singleChapter.toString())
    if (translate) params.append("translate", "true")

    return client<Blob>(`/novels/${id}/download?${params.toString()}`, {
      headers: {
        "Accept": "application/epub+zip"
      }
    })
  },
  updateReadingProgress: async (id: string, currentChapter: number) => {
    return client<NovelDetail>(`/novels/${id}/reading-progress`, {
      method: "PATCH",
      data: { current_chapter: currentChapter }
    })
  }
}

// Chapters API
export const chaptersAPI = {
  getByNovelId: async (
    novelId: string,
    page: number = 1,
    pageSize: number = 50,
    sortOrder: string = "desc"
  ): Promise<ApiResponse<ChapterListResponse>> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/novels/${novelId}/chapters?page=${page}&page_size=${pageSize}&sort_order=${sortOrder}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || "Failed to fetch chapters",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error fetching chapters:", error);
      return {
        success: false,
        error: "Failed to fetch chapters",
      };
    }
  },
  downloadSingle: async (novelId: string, chapterNumber: number, language: string = "en") => {
    return client<Blob>(`/novels/${novelId}/chapters/${chapterNumber}?language=${language}`, {
      headers: {
        "Accept": "application/epub+zip"
      }
    })
  },
  getChapterContent: async (novelId: string, chapterNumber: number): Promise<ApiResponse<ManhwaResponse>> => {
    return client<ManhwaResponse>(`/novels/${novelId}/chapters/${chapterNumber}`, {
      headers: {
        "Accept": "application/json"
      }
    });
  },
  downloadMultiple: async (novelId: string, chapterNumbers: number[], language: string = "en") => {
    return client<Blob>(`/novels/${novelId}/chapters/download?language=${language}`, {
      method: "POST",
      data: chapterNumbers,
      headers: {
        "Accept": "application/epub+zip"
      }
    })
  },
  fetchFromSource: async (novelId: string): Promise<ApiResponse<ChapterListResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/novels/${novelId}/chapters/fetch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || "Failed to fetch chapters from source",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching chapters from source:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch chapters from source',
      };
    }
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
