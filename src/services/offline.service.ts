import AsyncStorage from '@react-native-async-storage/async-storage';
// import RNFS from 'react-native-fs'; // Will be installed later
import { OfflineDownload, DownloadProgress, StorageInfo } from '../types/offline.types';
import { Lesson } from '../types/lesson.types';

/**
 * Offline Service
 * Handles lesson downloads, storage, and offline playback
 * Note: Requires react-native-fs package for file operations
 */

const OFFLINE_STORAGE_KEY = 'offline_downloads';

export const offlineService = {
  /**
   * T095: Download lesson for offline access
   * Downloads video file and transcript to local storage
   */
  downloadLesson: async (
    lesson: Lesson,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<OfflineDownload> => {
    try {
      // TODO: Implement actual file download when react-native-fs is installed
      // const videoPath = `${RNFS.DocumentDirectoryPath}/${OFFLINE_DIR}/videos/${lesson.id}.mp4`;
      // const transcriptPath = `${RNFS.DocumentDirectoryPath}/${OFFLINE_DIR}/transcripts/${lesson.id}.json`;
      
      // Mock implementation for development
      console.log('Mock: Downloading lesson:', lesson.title);
      
      // Simulate download progress
      const simulateProgress = (progress: number) => {
        if (onProgress) {
          onProgress({
            lessonId: lesson.id,
            progress,
            bytesDownloaded: progress * 1000000, // Mock 1MB per percent
            totalBytes: 100000000, // Mock 100MB
            status: progress === 100 ? 'completed' : 'downloading',
          });
        }
      };

      // Simulate progressive download
      for (let i = 0; i <= 100; i += 10) {
        simulateProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Create download record
      const download: OfflineDownload = {
        id: `download_${Date.now()}`,
        lessonId: lesson.id,
        videoFilePath: `/offline/videos/${lesson.id}.mp4`,
        transcriptFilePath: `/offline/transcripts/${lesson.id}.json`,
        thumbnailFilePath: lesson.thumbnail ? `/offline/thumbnails/${lesson.id}.jpg` : undefined,
        fileSize: 50000000, // Mock 50MB
        downloadedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
      };

      // Save to storage
      await offlineService.saveDownloadRecord(download);

      return download;
    } catch (error) {
      console.error('Failed to download lesson:', error);
      throw error;
    }
  },

  /**
   * T096: Get all offline downloads
   * Reads download metadata from AsyncStorage
   */
  getOfflineDownloads: async (): Promise<OfflineDownload[]> => {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_STORAGE_KEY);
      if (!data) return [];
      
      const downloads: OfflineDownload[] = JSON.parse(data);
      return downloads;
    } catch (error) {
      console.error('Failed to get offline downloads:', error);
      return [];
    }
  },

  /**
   * T097: Delete offline download
   * Removes video file, transcript, and metadata
   */
  deleteDownload: async (lessonId: string): Promise<void> => {
    try {
      // Get current downloads
      const downloads = await offlineService.getOfflineDownloads();
      const download = downloads.find(d => d.lessonId === lessonId);
      
      if (!download) {
        throw new Error('Download not found');
      }

      // TODO: Delete actual files when react-native-fs is installed
      // await RNFS.unlink(download.videoFilePath);
      // await RNFS.unlink(download.transcriptFilePath);
      // if (download.thumbnailFilePath) {
      //   await RNFS.unlink(download.thumbnailFilePath);
      // }

      console.log('Mock: Deleting download:', lessonId);

      // Remove from storage
      const updatedDownloads = downloads.filter(d => d.lessonId !== lessonId);
      await AsyncStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updatedDownloads));
    } catch (error) {
      console.error('Failed to delete download:', error);
      throw error;
    }
  },

  /**
   * Check if lesson is downloaded
   */
  isLessonDownloaded: async (lessonId: string): Promise<boolean> => {
    const downloads = await offlineService.getOfflineDownloads();
    return downloads.some(d => d.lessonId === lessonId);
  },

  /**
   * Get specific download by lesson ID
   */
  getDownloadByLessonId: async (lessonId: string): Promise<OfflineDownload | null> => {
    const downloads = await offlineService.getOfflineDownloads();
    return downloads.find(d => d.lessonId === lessonId) || null;
  },

  /**
   * Save download record to storage
   */
  saveDownloadRecord: async (download: OfflineDownload): Promise<void> => {
    const downloads = await offlineService.getOfflineDownloads();
    
    // Check if already exists
    const existingIndex = downloads.findIndex(d => d.lessonId === download.lessonId);
    
    if (existingIndex >= 0) {
      downloads[existingIndex] = download;
    } else {
      downloads.push(download);
    }

    await AsyncStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(downloads));
  },

  /**
   * Update last accessed time for a download
   */
  updateLastAccessed: async (lessonId: string): Promise<void> => {
    const downloads = await offlineService.getOfflineDownloads();
    const download = downloads.find(d => d.lessonId === lessonId);
    
    if (download) {
      download.lastAccessedAt = new Date().toISOString();
      await AsyncStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(downloads));
    }
  },

  /**
   * Get storage information
   */
  getStorageInfo: async (): Promise<StorageInfo> => {
    try {
      const downloads = await offlineService.getOfflineDownloads();
      const usedSpace = downloads.reduce((sum, d) => sum + d.fileSize, 0);

      // TODO: Get actual device storage info when react-native-fs is installed
      // const freeSpace = await RNFS.getFSInfo();
      
      return {
        totalSpace: 64000000000, // Mock 64GB
        usedSpace,
        availableSpace: 64000000000 - usedSpace,
        downloadCount: downloads.length,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      throw error;
    }
  },

  /**
   * Clear all offline downloads
   */
  clearAllDownloads: async (): Promise<void> => {
    const downloads = await offlineService.getOfflineDownloads();
    
    // Delete all files
    for (const download of downloads) {
      await offlineService.deleteDownload(download.lessonId);
    }
  },
};

export default offlineService;
