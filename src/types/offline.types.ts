/**
 * Offline Download Types
 * Types for offline lesson storage and management
 */

export interface OfflineDownload {
  id: string;                    // Unique download record ID (UUID)
  lessonId: string;              // Downloaded lesson ID
  videoFilePath: string;         // Local file path to downloaded video
  transcriptFilePath: string;    // Local file path to downloaded transcript JSON
  thumbnailFilePath?: string;    // Local file path to cached thumbnail
  fileSize: number;              // Total download size in bytes
  downloadedAt: string;          // Download completion timestamp (ISO 8601)
  lastAccessedAt: string;        // Last time lesson was played offline (ISO 8601)
}

export interface DownloadProgress {
  lessonId: string;
  progress: number;              // 0-100 percentage
  bytesDownloaded: number;
  totalBytes: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  error?: string;
}

export interface StorageInfo {
  totalSpace: number;            // Total device storage in bytes
  usedSpace: number;             // Used storage by app in bytes
  availableSpace: number;        // Available storage in bytes
  downloadCount: number;         // Number of downloaded lessons
}
