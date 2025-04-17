import axios from 'axios';
import { useMutation, useQuery } from '@tanstack/react-query';
import { API_CONFIG, API_ENDPOINTS } from './config';
import { Novel, Chapter } from './types';

// Configuración de axios
const api = axios.create(API_CONFIG);

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
  return useMutation({
    mutationFn: async (novel: Partial<Novel>) => {
      const response = await api.post(API_ENDPOINTS.NOVELS, novel);
      return response.data;
    },
  });
};

export const useUpdateNovel = () => {
  return useMutation({
    mutationFn: async ({ id, ...novel }: Partial<Novel> & { id: string }) => {
      const response = await api.patch(`${API_ENDPOINTS.NOVELS}/${id}`, novel);
      return response.data;
    },
  });
};

export const useDeleteNovel = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${API_ENDPOINTS.NOVELS}/${id}`);
    },
  });
};

// Hooks para capítulos
export const useChapters = (novelId: string) => {
  return useQuery({
    queryKey: ['chapters', novelId],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.CHAPTERS.replace(':novelId', novelId));
      return response.data;
    },
  });
};

export const useChapter = (novelId: string, chapterNumber: number) => {
  return useQuery({
    queryKey: ['chapter', novelId, chapterNumber],
    queryFn: async () => {
      const response = await api.get(
        `${API_ENDPOINTS.CHAPTERS.replace(':novelId', novelId)}/${chapterNumber}?format=raw`
      );
      return response.data;
    },
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

interface ChapterContent {
  title: string;
  content: string;
  chapter_number: number;
  novel_id: string;
} 