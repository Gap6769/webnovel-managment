import { Platform } from 'react-native';

// Configuración de la API
const API_BASE_URL = 'http://192.168.1.87:8001';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
};

export const API_ENDPOINTS = {
  NOVELS: '/api/v1/novels',
  CHAPTERS: '/api/v1/novels/:novelId/chapters',
  SETTINGS: '/api/v1/settings',
}; 