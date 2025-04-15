"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { novelsAPI } from "@/services/api"
import { useNovelStore } from "@/store/useNovelStore"
import type { Novel } from "@/types"
import { toast } from "sonner"

interface APINovel {
  _id: string
  title: string
  author: string | null
  cover_image_url: string | null
  description: string | null
  source_url: string
  source_name: string
  tags: string[]
  status: string | null
  chapters: Array<{
    title: string
    chapter_number: number
    chapter_title: string | null
    url: string
    read: boolean
    downloaded: boolean
  }>
  added_at: string
  last_updated_api: string
  last_updated_chapters: string | null
}

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
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch novels")
        }
        
        // Transform the API response to match our Novel type
        return (response.data as APINovel[]).map(novel => ({
          id: novel._id,
          title: novel.title,
          type: "webnovel", // Default type since it's not in the API response
          description: novel.description || "",
          author: novel.author || "",
          lastUpdated: novel.last_updated_api,
          coverImage: novel.cover_image_url || "",
          chapters: novel.chapters.length,
          source: novel.source_name,
          status: novel.status || "Ongoing",
          genres: novel.tags,
          lastScraped: novel.last_updated_chapters || novel.last_updated_api
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
    mutationFn: ({ id, data }: { id: number; data: Partial<Novel> }) => novelsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["novels"] })
    },
  })

  // Delete novel mutation
  const deleteNovelMutation = useMutation({
    mutationFn: (id: number) => novelsAPI.delete(id),
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
