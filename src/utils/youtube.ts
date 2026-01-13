// YouTube utility functions
// Migrated from ppgeil/lib/youtubeApi.js and ppgeil/components/LessonCard.js

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 */
export const extractVideoId = (url: string): string | null => {
  if (!url) return null;

  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Get YouTube thumbnail URL from video ID
 * Uses maxresdefault for highest quality
 * Fallback to hqdefault if maxres not available
 */
export const getThumbnailUrl = (videoIdOrUrl: string): string | null => {
  const videoId = videoIdOrUrl.includes('http') 
    ? extractVideoId(videoIdOrUrl) 
    : videoIdOrUrl;

  if (!videoId) return null;

  // Try maxresdefault first (1920x1080)
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

/**
 * Format video duration in MM:SS format
 */
export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '00:00';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Format view count with k suffix for thousands
 * Examples: 0, 150, 1.5k, 10.2k
 */
export const formatViewCount = (count: number): string => {
  if (!count || count < 0) return '0';

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }

  return count.toString();
};

/**
 * Get difficulty class name for styling
 * Maps A1/A2 to 'beginner', B1-C2 to 'experienced'
 */
export const getDifficultyClass = (level: string): 'beginner' | 'experienced' => {
  if (!level) return 'beginner';
  
  const levelLower = level.toLowerCase();
  if (levelLower === 'a1' || levelLower === 'a2') {
    return 'beginner';
  }
  
  return 'experienced';
};

/**
 * Get difficulty label (uppercase)
 */
export const getDifficultyLabel = (level: string): string => {
  if (!level) return 'A1';
  return level.toUpperCase();
};
