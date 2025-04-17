// This file contains API functions for content management

// Mock data for development - replace with actual API calls to your FastAPI backend
const API_BASE_URL = "http://your-fastapi-backend.com/api"

export const fetchLibrary = async (filter = "all") => {
  try {
    // In a real app, this would be:
    // const response = await fetch(`${API_BASE_URL}/library?filter=${filter}`);
    // return await response.json();

    // Mock data for development
    return mockLibraryData.filter((item) => filter === "all" || item.type === filter)
  } catch (error) {
    console.error("Error fetching library:", error)
    throw new Error("Failed to fetch library")
  }
}

export const fetchContentDetails = async (id) => {
  try {
    // In a real app, this would be:
    // const response = await fetch(`${API_BASE_URL}/content/${id}`);
    // return await response.json();

    // Mock data for development
    const content = mockLibraryData.find((item) => item.id === id)
    if (!content) throw new Error("Content not found")

    return {
      ...content,
      chapters: mockChaptersData.filter((chapter) => chapter.contentId === id),
    }
  } catch (error) {
    console.error("Error fetching content details:", error)
    throw new Error("Failed to fetch content details")
  }
}

export const fetchChapterContent = async (contentId, chapterId) => {
  try {
    // In a real app, this would be:
    // const response = await fetch(`${API_BASE_URL}/content/${contentId}/chapter/${chapterId}`);
    // return await response.json();

    // Mock data for development
    const content = mockLibraryData.find((item) => item.id === contentId)
    const chapters = mockChaptersData.filter((chapter) => chapter.contentId === contentId)
    const currentChapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId)

    if (currentChapterIndex === -1) throw new Error("Chapter not found")

    const currentChapter = chapters[currentChapterIndex]
    const prevChapterId = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1].id : null
    const nextChapterId = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1].id : null

    return {
      title: currentChapter.title,
      content: content.type === "novel" ? mockChapterContent : null,
      images: content.type === "manhwa" ? mockChapterImages : null,
      prevChapterId,
      nextChapterId,
    }
  } catch (error) {
    console.error("Error fetching chapter content:", error)
    throw new Error("Failed to fetch chapter content")
  }
}

export const addContent = async (contentData) => {
  try {
    // In a real app, this would be:
    // const response = await fetch(`${API_BASE_URL}/content`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(contentData),
    // });
    // return await response.json();

    // Mock success for development
    return { success: true, id: Math.floor(Math.random() * 1000) }
  } catch (error) {
    console.error("Error adding content:", error)
    throw new Error("Failed to add content")
  }
}

export const updateContent = async (id, contentData) => {
  try {
    // In a real app, this would be:
    // const response = await fetch(`${API_BASE_URL}/content/${id}`, {
    //   method: 'PUT',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(contentData),
    // });
    // return await response.json();

    // Mock success for development
    return { success: true }
  } catch (error) {
    console.error("Error updating content:", error)
    throw new Error("Failed to update content")
  }
}

export const refreshContent = async (id) => {
  try {
    // In a real app, this would be:
    // const response = await fetch(`${API_BASE_URL}/content/${id}/refresh`, {
    //   method: 'POST',
    // });
    // return await response.json();

    // Mock success for development
    return { success: true, newChapters: 2 }
  } catch (error) {
    console.error("Error refreshing content:", error)
    throw new Error("Failed to refresh content")
  }
}

// Mock data
const mockLibraryData = [
  {
    id: 1,
    title: "The Beginning After The End",
    type: "novel",
    source: "tapread.com",
    coverUrl: "https://via.placeholder.com/300x450?text=TBATE",
    chapters: 350,
    lastUpdated: "2023-04-15T10:30:00Z",
  },
  {
    id: 2,
    title: "Solo Leveling",
    type: "manhwa",
    source: "webtoons.com",
    coverUrl: "https://via.placeholder.com/300x450?text=Solo+Leveling",
    chapters: 179,
    lastUpdated: "2023-04-10T14:20:00Z",
  },
  {
    id: 3,
    title: "Omniscient Reader's Viewpoint",
    type: "novel",
    source: "wuxiaworld.com",
    coverUrl: "https://via.placeholder.com/300x450?text=ORV",
    chapters: 551,
    lastUpdated: "2023-04-12T09:15:00Z",
  },
  {
    id: 4,
    title: "Tower of God",
    type: "manhwa",
    source: "webtoons.com",
    coverUrl: "https://via.placeholder.com/300x450?text=Tower+of+God",
    chapters: 550,
    lastUpdated: "2023-04-14T16:45:00Z",
  },
]

const mockChaptersData = [
  { id: 101, contentId: 1, title: "Chapter 1: Beginning", updatedAt: "2023-01-01T10:00:00Z", isNew: false },
  { id: 102, contentId: 1, title: "Chapter 2: Discovery", updatedAt: "2023-01-08T10:00:00Z", isNew: false },
  { id: 103, contentId: 1, title: "Chapter 3: Training", updatedAt: "2023-01-15T10:00:00Z", isNew: false },
  { id: 104, contentId: 1, title: "Chapter 4: Adventure", updatedAt: "2023-01-22T10:00:00Z", isNew: true },
  { id: 105, contentId: 1, title: "Chapter 5: Conflict", updatedAt: "2023-01-29T10:00:00Z", isNew: true },

  { id: 201, contentId: 2, title: "Chapter 1: Awakening", updatedAt: "2023-02-01T10:00:00Z", isNew: false },
  { id: 202, contentId: 2, title: "Chapter 2: First Hunt", updatedAt: "2023-02-08T10:00:00Z", isNew: false },
  { id: 203, contentId: 2, title: "Chapter 3: Level Up", updatedAt: "2023-02-15T10:00:00Z", isNew: true },

  { id: 301, contentId: 3, title: "Chapter 1: Prologue", updatedAt: "2023-03-01T10:00:00Z", isNew: false },
  { id: 302, contentId: 3, title: "Chapter 2: The Dokkaebi", updatedAt: "2023-03-08T10:00:00Z", isNew: false },
  { id: 303, contentId: 3, title: "Chapter 3: Scenario", updatedAt: "2023-03-15T10:00:00Z", isNew: false },

  { id: 401, contentId: 4, title: "Chapter 1: Ball Test", updatedAt: "2023-04-01T10:00:00Z", isNew: false },
  { id: 402, contentId: 4, title: "Chapter 2: Crown Game", updatedAt: "2023-04-08T10:00:00Z", isNew: false },
  { id: 403, contentId: 4, title: "Chapter 3: Position Test", updatedAt: "2023-04-15T10:00:00Z", isNew: true },
]

const mockChapterContent = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.

Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
`

const mockChapterImages = [
  "https://via.placeholder.com/800x1200?text=Page+1",
  "https://via.placeholder.com/800x1200?text=Page+2",
  "https://via.placeholder.com/800x1200?text=Page+3",
  "https://via.placeholder.com/800x1200?text=Page+4",
]
