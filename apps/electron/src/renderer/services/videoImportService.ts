import { videoAPI } from './api';
import { VideoClip } from '../types';

export interface VideoImportResult {
  success: boolean;
  clip?: VideoClip;
  error?: string;
}

export class VideoImportService {
  private static instance: VideoImportService;
  private supportedFormats = [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/mkv',
    'video/wmv',
    'video/flv',
    'video/webm',
    'video/m4v',
    'video/3gp',
    'video/ogv'
  ];

  private constructor() {}

  static getInstance(): VideoImportService {
    if (!VideoImportService.instance) {
      VideoImportService.instance = new VideoImportService();
    }
    return VideoImportService.instance;
  }

  /**
   * Check if a file is a supported video format
   */
  isVideoFile(file: File): boolean {
    return this.supportedFormats.includes(file.type);
  }

  /**
   * Get supported video extensions for display
   */
  getSupportedExtensions(): string[] {
    return this.supportedFormats.map(type => type.replace('video/', ''));
  }

  /**
   * Validate video file size (default 100MB limit)
   */
  validateFileSize(file: File, maxSizeMB: number = 100): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * Import video file via file picker
   */
  async importVideoFile(): Promise<VideoImportResult> {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = this.supportedFormats.join(',');
      input.multiple = false;

      return new Promise((resolve) => {
        input.onchange = async (event) => {
          const target = event.target as HTMLInputElement;
          const file = target.files?.[0];

          if (!file) {
            resolve({ success: false, error: 'No file selected' });
            return;
          }

          const result = await this.processVideoFile(file);
          resolve(result);
        };

        input.click();
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import video file'
      };
    }
  }

  /**
   * Process video file and upload to backend
   */
  async processVideoFile(file: File, onProgress?: (progress: number) => void): Promise<VideoImportResult> {
    try {
      // Validate file type
      if (!this.isVideoFile(file)) {
        return {
          success: false,
          error: `Unsupported video format. Supported formats: ${this.getSupportedExtensions().join(', ')}`
        };
      }

      // Validate file size
      if (!this.validateFileSize(file)) {
        return {
          success: false,
          error: `File too large. Maximum size: 100MB`
        };
      }

      // Upload video to backend with progress tracking
      const response = await videoAPI.upload(file, onProgress);

      if (response.data.success) {
        return {
          success: true,
          clip: response.data.clip
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Failed to upload video'
        };
      }
    } catch (error) {
      console.error('Video import error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process video file'
      };
    }
  }

  /**
   * Handle drag and drop events
   */
  setupDragAndDrop(
    dropZone: HTMLElement,
    onDrop: (file: File) => void,
    onDragOver?: (event: DragEvent) => void,
    onDragLeave?: (event: DragEvent) => void
  ): () => void {
    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.add('drag-over');
      onDragOver?.(event);
    };

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.remove('drag-over');
      onDragLeave?.(event);
    };

    const handleDrop = async (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.remove('drag-over');

      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];
      onDrop(file);
    };

    // Add event listeners
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    // Return cleanup function
    return () => {
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      dropZone.removeEventListener('drop', handleDrop);
    };
  }

  /**
   * Extract video metadata for AI usage
   */
  async extractVideoMetadata(clip: VideoClip): Promise<any> {
    try {
      const response = await videoAPI.getInfo(clip.id);
      return {
        id: clip.id,
        name: clip.name,
        path: clip.path,
        duration: clip.duration,
        thumbnail: clip.thumbnail,
        metadata: response.data
      };
    } catch (error) {
      console.error('Failed to extract video metadata:', error);
      return {
        id: clip.id,
        name: clip.name,
        path: clip.path,
        duration: clip.duration,
        thumbnail: clip.thumbnail,
        metadata: null
      };
    }
  }
}

export const videoImportService = VideoImportService.getInstance();
