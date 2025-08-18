/**
 * Utility functions for constructing media URLs
 */

// Backend server configuration
const BACKEND_URL = 'http://localhost:3001';

/**
 * Constructs a full URL for media files (videos, thumbnails, etc.)
 * @param path - The relative path to the media file
 * @returns The full URL to the media file
 */
export const getMediaUrl = (path: string): string => {
  // If path already has http/https, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Construct full URL from backend server
  return `${BACKEND_URL}/${cleanPath}`;
};

/**
 * Constructs a full URL for video files specifically
 * @param path - The relative path to the video file
 * @returns The full URL to the video file
 */
export const getVideoUrl = (path: string): string => {
  return getMediaUrl(path);
};

/**
 * Constructs a full URL for thumbnail files
 * @param path - The relative path to the thumbnail file
 * @returns The full URL to the thumbnail file
 */
export const getThumbnailUrl = (path: string): string => {
  return getMediaUrl(path);
};
