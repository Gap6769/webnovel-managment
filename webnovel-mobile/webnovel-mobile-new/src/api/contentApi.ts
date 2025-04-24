import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_CONFIG, API_ENDPOINTS } from './config';
import { Novel, Chapter } from './types';

// Configuración de axios con timeout aumentado
const api = axios.create({
  ...API_CONFIG,
  timeout: 30000, // 30 segundos
  timeoutErrorMessage: 'Request timed out. Please check your connection and try again.',
});

// Hooks para novelas
export const useNovels = () => {
  return useQuery({
    queryKey: ['novels'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.NOVELS);
      return response.data;
    },
  });
};

export const useNovel = (id: string) => {
  return useQuery({
    queryKey: ['novel', id],
    queryFn: async () => {
      const response = await api.get(`${API_ENDPOINTS.NOVELS}/${id}`);
      return response.data;
    },
  });
};

export const useCreateNovel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (novelData: {
      title: string;
      source_url: string;
      source_name: string;
      source_language: string;
      type: 'novel' | 'manhwa';
    }) => {
      const response = await api.post('/api/v1/novels/', novelData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novels'] });
    }
  });
};

export const useUpdateNovel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...novelData }: {
      id: string;
      title?: string;
      author?: string;
      cover_image_url?: string;
      status?: string;
      type?: 'novel' | 'manhwa';
      source_language?: string;
      source_name?: string;
      source_url?: string;
      description?: string;
      tags?: string[];
    }) => {
      const response = await api.patch(`/api/v1/novels/${id}`, novelData);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['novel', id] });
      queryClient.invalidateQueries({ queryKey: ['novels'] });
    }
  });
};

export const useDeleteNovel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${API_ENDPOINTS.NOVELS}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novels'] });
    }
  });
};

// Hooks para capítulos
export const useChapters = (novelId: string, page: number = 1, sortOrder: 'asc' | 'desc' = 'desc') => {
  return useQuery({
    queryKey: ['chapters', novelId, page, sortOrder],
    queryFn: async () => {
      const response = await api.get(`${API_ENDPOINTS.NOVELS}/${novelId}/chapters?page=${page}&sort_order=${sortOrder}`);
      return {
        chapters: response.data.chapters,
        total_pages: response.data.total_pages || 0,
        page: response.data.page,
        page_size: response.data.page_size
      };
    },
  });
};

interface ChapterContent {
  title: string;
  content?: string;
  chapter_number: number;
  novel_id: string;
  type?: 'novel' | 'manhwa';
  images?: Array<{
    url: string;
    alt: string;
    width: number | null;
    height: number | null;
  }>;
}

export const useChapter = (novelId: string, chapterNumber: number) => {
  return useQuery({
    queryKey: ['chapter', novelId, chapterNumber],
    queryFn: async () => {
      try {
        // if the novel is shadow slave use language es in params
        const response = await api.get(
          `${API_ENDPOINTS.CHAPTERS.replace(':novelId', novelId)}/${chapterNumber}?format=raw&language=es`
        );
        return response.data as ChapterContent;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED') {
            throw new Error('Request timed out. Please check your connection and try again.');
          }
          throw new Error(error.response?.data?.message || error.message);
        }
        throw error;
      }
    },
    retry: 1, // Intentar 2 veces más en caso de error
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Retry con backoff exponencial
  });
};

export const useUpdateReadingProgress = () => {
  return useMutation({
    mutationFn: async ({ novelId, chapterNumber }: { novelId: string; chapterNumber: number }) => {
      const response = await api.patch(
        `${API_ENDPOINTS.NOVELS}/${novelId}/reading-progress?current_chapter=${chapterNumber}`
      );
      return response.data;
    },
  });
};

export const useFetchChapters = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (novelId: string) => {
      const response = await api.post(`${API_ENDPOINTS.NOVELS}/${novelId}/chapters/fetch`);
      return response.data;
    },
    onSuccess: (_, novelId) => {
      queryClient.invalidateQueries({ queryKey: ['chapters', novelId] });
      queryClient.invalidateQueries({ queryKey: ['novel', novelId] });
    }
  });
};

export const useSources = () => {
  return useQuery({
    queryKey: ['sources'],
    queryFn: async () => {
      const response = await api.get('/api/v1/sources/');
      return response.data;
    },
  });
}; 