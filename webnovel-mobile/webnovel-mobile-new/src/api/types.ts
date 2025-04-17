export interface Novel {
  _id: string;
  title: string;
  author?: string;
  cover_image_url?: string;
  description?: string;
  source_url: string;
  source_name: string;
  tags: string[];
  status?: string;
  total_chapters: number;
  last_chapter_number: number;
  read_chapters: number;
  downloaded_chapters: number;
  last_updated_chapters?: string;
  added_at: string;
  reading_progress: number;
}

export interface Chapter {
  title: string;
  chapter_number: number;
  chapter_title?: string;
  url: string;
  read: boolean;
  downloaded: boolean;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ErrorResponse {
  message: string;
  details?: string;
} 