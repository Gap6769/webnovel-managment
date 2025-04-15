import { create } from "zustand"
import type { Novel, Chapter, QueryStatus } from "@/types"

interface NovelState {
  novels: Novel[]
  filteredNovels: Novel[]
  selectedNovel: Novel | null
  chapters: Record<number, Chapter[]>
  currentChapter: Chapter | null
  status: QueryStatus
  error: string | null
}

interface NovelStore extends NovelState {
  setNovels: (novels: Novel[]) => void
  setFilteredNovels: (novels: Novel[]) => void
  setSelectedNovel: (novel: Novel | null) => void
  setChapters: (novelId: number, chapters: Chapter[]) => void
  setCurrentChapter: (chapter: Chapter | null) => void
  addNovel: (novel: Novel) => void
  updateNovel: (novel: Novel) => void
  removeNovel: (novelId: number) => void
  markChapterAsRead: (chapterId: number, read: boolean) => void
  setStatus: (status: QueryStatus) => void
  setError: (error: string | null) => void
}

export const useNovelStore = create<NovelStore>((set) => ({
  novels: [],
  filteredNovels: [],
  selectedNovel: null,
  chapters: {},
  currentChapter: null,
  status: "idle",
  error: null,
  setNovels: (novels) => set({ novels, filteredNovels: novels }),
  setFilteredNovels: (filteredNovels) => set({ filteredNovels }),
  setSelectedNovel: (selectedNovel) => set({ selectedNovel }),
  setChapters: (novelId, chapters) =>
    set((state) => ({
      chapters: {
        ...state.chapters,
        [novelId]: chapters,
      },
    })),
  setCurrentChapter: (currentChapter) => set({ currentChapter }),
  addNovel: (novel) =>
    set((state) => {
      const novels = [...state.novels, novel]
      return { novels, filteredNovels: novels }
    }),
  updateNovel: (novel) =>
    set((state) => {
      const novels = state.novels.map((n) => (n.id === novel.id ? novel : n))
      return {
        novels,
        filteredNovels: state.filteredNovels.map((n) => (n.id === novel.id ? novel : n)),
        selectedNovel: state.selectedNovel?.id === novel.id ? novel : state.selectedNovel,
      }
    }),
  removeNovel: (novelId) =>
    set((state) => {
      const novels = state.novels.filter((n) => n.id !== novelId)
      return {
        novels,
        filteredNovels: state.filteredNovels.filter((n) => n.id !== novelId),
        selectedNovel: state.selectedNovel?.id === novelId ? null : state.selectedNovel,
      }
    }),
  markChapterAsRead: (chapterId, read) =>
    set((state) => {
      const updatedChapters = { ...state.chapters }

      // Find which novel contains this chapter
      for (const novelId in updatedChapters) {
        updatedChapters[Number(novelId)] = updatedChapters[Number(novelId)].map((chapter) =>
          chapter.id === chapterId ? { ...chapter, read } : chapter,
        )
      }

      // Also update current chapter if it's the one being marked
      const currentChapter =
        state.currentChapter?.id === chapterId ? { ...state.currentChapter, read } : state.currentChapter

      return { chapters: updatedChapters, currentChapter }
    }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
}))
