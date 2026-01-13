import { useState, useEffect, useCallback } from 'react';
import offlineService from '../services/offline.service';
import { OfflineDownload, DownloadProgress, StorageInfo } from '../types/offline.types';
import { Lesson } from '../types/lesson.types';

/**
 * Offline Downloads Hook
 * Manages lesson downloads, list, and deletion
 */

export const useOfflineDownloads = () => {
  const [downloads, setDownloads] = useState<OfflineDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, DownloadProgress>>({});
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  /**
   * Load all downloads
   */
  const loadDownloads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await offlineService.getOfflineDownloads();
      setDownloads(data);
      
      const info = await offlineService.getStorageInfo();
      setStorageInfo(info);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load downloads';
      setError(message);
      console.error('Error loading downloads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load downloads on mount
  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  /**
   * Download a lesson
   */
  const downloadLesson = useCallback(async (lesson: Lesson): Promise<void> => {
    try {
      // Check if already downloaded
      const isDownloaded = await offlineService.isLessonDownloaded(lesson.id);
      if (isDownloaded) {
        throw new Error('Lesson already downloaded');
      }

      // Start download
      await offlineService.downloadLesson(lesson, (progress) => {
        setDownloadProgress(prev => ({
          ...prev,
          [lesson.id]: progress,
        }));
      });

      // Clear progress
      setDownloadProgress(prev => {
        const updated = { ...prev };
        delete updated[lesson.id];
        return updated;
      });

      // Reload downloads
      await loadDownloads();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed';
      setError(message);
      console.error('Download error:', err);
      throw err;
    }
  }, [loadDownloads]);

  /**
   * Delete a download
   */
  const deleteDownload = useCallback(async (lessonId: string): Promise<void> => {
    try {
      await offlineService.deleteDownload(lessonId);
      await loadDownloads();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete download';
      setError(message);
      console.error('Delete error:', err);
      throw err;
    }
  }, [loadDownloads]);

  /**
   * Check if a lesson is downloaded
   */
  const isLessonDownloaded = useCallback((lessonId: string): boolean => {
    return downloads.some(d => d.lessonId === lessonId);
  }, [downloads]);

  /**
   * Get download for a specific lesson
   */
  const getDownload = useCallback((lessonId: string): OfflineDownload | undefined => {
    return downloads.find(d => d.lessonId === lessonId);
  }, [downloads]);

  /**
   * Clear all downloads
   */
  const clearAllDownloads = useCallback(async (): Promise<void> => {
    try {
      await offlineService.clearAllDownloads();
      await loadDownloads();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear downloads';
      setError(message);
      console.error('Clear all error:', err);
      throw err;
    }
  }, [loadDownloads]);

  /**
   * Refresh storage info
   */
  const refreshStorageInfo = useCallback(async (): Promise<void> => {
    try {
      const info = await offlineService.getStorageInfo();
      setStorageInfo(info);
    } catch (err) {
      console.error('Failed to refresh storage info:', err);
    }
  }, []);

  return {
    // State
    downloads,
    loading,
    error,
    downloadProgress,
    storageInfo,

    // Actions
    downloadLesson,
    deleteDownload,
    isLessonDownloaded,
    getDownload,
    clearAllDownloads,
    refresh: loadDownloads,
    refreshStorageInfo,

    // Computed
    downloadCount: downloads.length,
    totalSize: downloads.reduce((sum, d) => sum + d.fileSize, 0),
  };
};

export default useOfflineDownloads;
