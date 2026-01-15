// Unlock service - API calls for lesson unlock functionality
// POST /api/lessons/:id/unlock - migrated from Next.js implementation

import api from './api';
import type { UnlockResponse } from '../types/unlock.types';

/**
 * Unlock a lesson for the current user
 * Uses free unlock if available, otherwise deducts 100 points
 * 
 * @param lessonId - The ID of the lesson to unlock
 * @returns UnlockResponse with success status and updated info
 * @throws Error if request fails
 */
export const unlockLesson = async (lessonId: string): Promise<UnlockResponse> => {
    try {
        console.log('[UnlockService] Unlocking lesson:', lessonId);

        const response = await api.post<UnlockResponse>(`/api/lessons/${lessonId}/unlock`);

        console.log('[UnlockService] Unlock response:', response.data);

        return response.data;
    } catch (error: any) {
        console.error('[UnlockService] Error unlocking lesson:', error);

        // Handle specific error response from API
        if (error.response?.data) {
            return {
                success: false,
                error: error.response.data.error || 'Failed to unlock lesson',
                required: error.response.data.required,
                current: error.response.data.current,
            };
        }

        throw error;
    }
};

/**
 * Check if a lesson can be unlocked based on user's info
 * 
 * @param freeUnlocksRemaining - Number of free unlocks remaining
 * @param userPoints - User's current points balance
 * @param unlockCost - Cost to unlock (default 100)
 * @returns Object with canUnlock status and method
 */
export const canUnlockLesson = (
    freeUnlocksRemaining: number,
    userPoints: number,
    unlockCost: number = 100
): { canUnlock: boolean; canUnlockFree: boolean; canUnlockWithPoints: boolean } => {
    const canUnlockFree = freeUnlocksRemaining > 0;
    const canUnlockWithPoints = userPoints >= unlockCost;

    return {
        canUnlock: canUnlockFree || canUnlockWithPoints,
        canUnlockFree,
        canUnlockWithPoints,
    };
};

export const unlockService = {
    unlockLesson,
    canUnlockLesson,
};

export default unlockService;
