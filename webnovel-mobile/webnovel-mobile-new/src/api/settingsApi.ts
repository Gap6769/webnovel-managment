import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface Settings {
  darkMode: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  notificationsEnabled: boolean;
  downloadChapters: boolean;
  maxDownloads: number;
}

export const getSettings = async (): Promise<Settings> => {
  const response = await fetch(`${API_BASE_URL}/settings`);
  if (!response.ok) throw new Error('Failed to fetch settings');
  return response.json();
};

export const updateSettings = async (settings: Partial<Settings>): Promise<Settings> => {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!response.ok) throw new Error('Failed to update settings');
  return response.json();
};

// React Query hooks
export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}; 