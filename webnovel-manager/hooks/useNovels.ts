"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { novelsAPI, chaptersAPI } from "@/services/api"
import { useNovelStore } from "@/store/useNovelStore"
import type { Novel, NovelDetail, Chapter, ApiResponse, ChapterListResponse } from "@/types"
import { toast } from "sonner"

export function useNovels() {
  const queryClient = useQueryClient()
  const { setNovels, setFilteredNovels, setStatus, setError } = useNovelStore()
  const [filter, setFilter] = useState<string>("all")

  // Fetch all novels
  const { data, isLoading, error, refetch } = useQuery<Novel[]>({
    queryKey: ["novels"],
    queryFn: async (): Promise<Novel[]> => {
      try {
        const response = await novelsAPI.getAll()
        if (!response.success || !response.data) {
          throw new Error(response.error || "Failed to fetch novels")
        }
        
        return response.data.map(novel => ({
          _id: novel._id,
          title: novel.title,
          author: novel.author,
          cover_image_url: novel.cover_image_url,
          description: novel.description,
          source_url: novel.source_url,
          source_name: novel.source_name,
          tags: novel.tags,
          status: novel.status,
          chapters: novel.chapters || [],
          added_at: novel.added_at,
          last_updated_api: novel.last_updated_api,
          last_updated_chapters: novel.last_updated_chapters,
          last_scraped: novel.last_scraped,
          next_update: novel.next_update,
          update_schedule: novel.update_schedule
        }))
      } catch (error) {
        console.error("Error fetching novels:", error)
        throw error
      }
    },
  })

  // Create novel mutation
  const createNovelMutation = useMutation({
    mutationFn: (novelData: Partial<Novel>) => novelsAPI.create(novelData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["novels"] })
    },
  })

  // Update novel mutation
  const updateNovelMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Novel> }) => novelsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["novels"] })
    },
  })

  // Delete novel mutation
  const deleteNovelMutation = useMutation({
    mutationFn: (id: string) => novelsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["novels"] })
    },
  })

  // Update store when data changes
  useEffect(() => {
    if (data) {
      setNovels(data)
      setFilteredNovels(data)
      setStatus("success")
    }
  }, [data, setNovels, setFilteredNovels, setStatus])

  // Update store when error occurs
  useEffect(() => {
    if (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setStatus("error")
    }
  }, [error, setError, setStatus])

  return {
    novels: data || [],
    loading: isLoading,
    error: error instanceof Error ? error.message : "An error occurred",
    refreshNovels: refetch,
    createNovel: createNovelMutation.mutate,
    updateNovel: updateNovelMutation.mutate,
    deleteNovel: deleteNovelMutation.mutate,
    filter,
    setFilter,
  }
}

export function useNovel(id: string) {
  const [novel, setNovel] = useState<NovelDetail | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchingChapters, setFetchingChapters] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReversed, setIsReversed] = useState(true)

  const fetchNovel = async (sortOrder: string = "desc") => {
    try {
      setLoading(true)
      const [novelResponse, chaptersResponse] = await Promise.all([
        novelsAPI.getById(id),
        chaptersAPI.getByNovelId(id, 1, 50, sortOrder)
      ])

      if (novelResponse.success && novelResponse.data) {
        setNovel(novelResponse.data)
      } else {
        setError(novelResponse.error || "Failed to fetch novel")
      }

      if (chaptersResponse.success && chaptersResponse.data) {
        const chaptersData = Array.isArray(chaptersResponse.data) 
          ? chaptersResponse.data 
          : chaptersResponse.data.chapters || []
        setChapters(chaptersData)
      } else {
        setError(chaptersResponse.error || "Failed to fetch chapters")
      }
    } catch (err) {
      console.error('Error in fetchNovel:', err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const updateReadingProgress = async (currentChapter: number) => {
    try {
      const response = await novelsAPI.updateReadingProgress(id, currentChapter)
      if (response.success && response.data) {
        setNovel(response.data)
      } else {
        setError(response.error || "Failed to update reading progress")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const toggleSortOrder = () => {
    const newOrder = isReversed ? "asc" : "desc"
    setIsReversed(!isReversed)
    fetchNovel(newOrder)
  }

  const fetchChaptersFromSource = async () => {
    try {
      setFetchingChapters(true)
      setError(null)

      const response = await chaptersAPI.fetchFromSource(id)

      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data) {
        const newChapters = response.data.chapters
        if (JSON.stringify(chapters) !== JSON.stringify(newChapters)) {
          setChapters(newChapters)
        }
        
        if (novel) {
          const newLastUpdated = new Date().toISOString()
          if (novel.last_updated_chapters !== newLastUpdated) {
            setNovel({
              ...novel,
              last_updated_chapters: newLastUpdated,
            })
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch chapters from source")
    } finally {
      setFetchingChapters(false)
    }
  }

  useEffect(() => {
    fetchNovel()
  }, [id])

  return {
    novel,
    chapters,
    loading,
    fetchingChapters,
    error,
    updateReadingProgress,
    isReversed,
    toggleSortOrder,
    fetchChaptersFromSource,
  }
}
