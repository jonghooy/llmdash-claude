export interface Memory {
  id: string;
  organization_id: string;
  created_by: string;
  title: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  tags?: string[];
  created_at: string;
  updated_at: string;
  access_level: 'private' | 'team' | 'organization' | 'public';
  usage_count: number;
  last_accessed?: string;
  size_bytes?: number;
}

export interface File {
  id: string;
  organization_id: string;
  uploaded_by: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  metadata?: Record<string, any>;
  tags?: string[];
  created_at: string;
  updated_at: string;
  access_level: 'private' | 'team' | 'organization' | 'public';
  download_count: number;
  last_accessed?: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
}

export interface ResourceStats {
  totalMemories: number;
  totalFiles: number;
  totalSizeBytes: number;
  activeUsers: number;
  recentActivity: {
    date: string;
    memories: number;
    files: number;
    accesses: number;
  }[];
  topTags: {
    tag: string;
    count: number;
  }[];
  storageByType: {
    type: string;
    size: number;
    count: number;
  }[];
}

export interface ResourceFilters {
  search?: string;
  type?: 'memory' | 'file' | 'all';
  access?: 'private' | 'team' | 'organization' | 'public' | 'all';
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  createdBy?: string;
  sortBy?: 'name' | 'date' | 'size' | 'usage';
  sortOrder?: 'asc' | 'desc';
}