// Unlock feature types - for lock/unlock lesson functionality
// Migrated from Next.js ppgeil implementation

/**
 * User's unlock status information
 * Returned from /api/homepage-data and /api/lessons endpoints
 */
export interface UserUnlockInfo {
    freeUnlocksRemaining: number; // Number of free unlocks left (default 2 for new users)
    unlockedCount: number; // Total lessons unlocked by user
    points: number; // User's current points balance
}

/**
 * Response from POST /api/lessons/:id/unlock
 */
export interface UnlockResponse {
    success: boolean;
    usedFreeUnlock?: boolean; // true if used free unlock
    freeUnlocksRemaining?: number; // Updated free unlock count
    pointsDeducted?: number; // Points used (100 if not free)
    remainingPoints?: number; // User's remaining points after unlock
    error?: string; // Error message if failed
    required?: number; // Points required (100)
    current?: number; // User's current points (if not enough)
}

/**
 * Unlock cost constant
 */
export const UNLOCK_COST = 100;
