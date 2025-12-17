// Progress service - Track user learning progress

import api from './api';
import type { SaveProgressRequest, SaveProgressResponse } from '../types/progress.types';
import { saveData, getData, STORAGE_KEYS } from './storage.service';

/**
 * Save user progress for completed lesson
 * POST /api/progress
 */
export const saveProgress = async (progressData: SaveProgressRequest): Promise<SaveProgressResponse> => {
  try {
    console.log('[ProgressService] Saving progress:', progressData);
    
    const response = await api.post<SaveProgressResponse>('/api/progress', progressData);
    
    return response.data;
  } catch (error) {
    console.error('[ProgressService] Error saving progress, queuing for later:', error);
    
    // Queue for offline sync
    await queueProgressForSync(progressData);
    
    // Return optimistic response
    return {
      progress: {
        id: `temp-${Date.now()}`,
        userId: 'temp',
        ...progressData,
        completedAt: new Date().toISOString(),
      },
      user: {
        points: 0,
        streak: 0,
        answerStreak: 0,
      },
    };
  }
};

/**
 * Queue progress for offline sync
 */
const queueProgressForSync = async (progressData: SaveProgressRequest): Promise<void> => {
  try {
    const queue = await getData<SaveProgressRequest[]>(STORAGE_KEYS.PROGRESS_QUEUE) || [];
    queue.push(progressData);
    await saveData(STORAGE_KEYS.PROGRESS_QUEUE, queue);
    console.log('[ProgressService] Progress queued for sync:', queue.length, 'items');
  } catch (error) {
    console.error('[ProgressService] Error queuing progress:', error);
  }
};

/**
 * Sync queued progress when online
 */
export const syncQueuedProgress = async (): Promise<void> => {
  try {
    const queue = await getData<SaveProgressRequest[]>(STORAGE_KEYS.PROGRESS_QUEUE);
    
    if (!queue || queue.length === 0) {
      return;
    }

    console.log('[ProgressService] Syncing', queue.length, 'queued progress items');

    // Try to sync each item
    const failedItems: SaveProgressRequest[] = [];
    
    for (const item of queue) {
      try {
        await api.post('/api/progress', item);
      } catch (error) {
        console.error('[ProgressService] Failed to sync item:', error);
        failedItems.push(item);
      }
    }

    // Update queue with failed items only
    await saveData(STORAGE_KEYS.PROGRESS_QUEUE, failedItems);
    
    if (failedItems.length === 0) {
      console.log('[ProgressService] All progress synced successfully');
    } else {
      console.log('[ProgressService] Some items failed to sync:', failedItems.length);
    }
  } catch (error) {
    console.error('[ProgressService] Error syncing progress:', error);
  }
};

export const progressService = {
  saveProgress,
  syncQueuedProgress,
};

export default progressService;
