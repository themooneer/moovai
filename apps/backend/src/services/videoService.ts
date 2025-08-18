import { promises as fs } from 'fs';
import path from 'path';
import { VideoClip, TimelineTrack } from '@ai-video-editor/shared';
import { generateId } from '@ai-video-editor/shared';
import { FFmpegService } from './ffmpegService';

export class VideoService {
  private ffmpegService: FFmpegService;

  constructor() {
    this.ffmpegService = new FFmpegService();
  }

  async getVideoInfo(filePath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
    size: number;
    format: string;
  }> {
    try {
      const stats = await fs.stat(filePath);
      const videoInfo = await this.ffmpegService.getVideoInfo(filePath);

      return {
        ...videoInfo,
        size: stats.size,
        format: path.extname(filePath).substring(1)
      };
    } catch (error) {
      console.error('Error getting video info:', error);
      throw new Error('Failed to get video information');
    }
  }

  async createVideoClip(
    filePath: string,
    videoInfo: any
  ): Promise<VideoClip> {
    const clip: VideoClip = {
      id: generateId(),
      name: path.basename(filePath, path.extname(filePath)),
      path: filePath,
      startTime: 0,
      endTime: videoInfo.duration,
      duration: videoInfo.duration,
      thumbnail: await this.generateThumbnail(filePath)
    };

    return clip;
  }

  async generateThumbnail(filePath: string): Promise<string> {
    try {
      const thumbnailPath = path.join(
        path.dirname(filePath),
        `thumb_${path.basename(filePath, path.extname(filePath))}.jpg`
      );

      // Generate thumbnail at 1 second mark using a simpler approach
      await this.ffmpegService.executeOperation({
        id: generateId(),
        type: 'thumbnail',
        parameters: { time: 1 },
        inputFile: filePath,
        outputFile: thumbnailPath,
        status: 'pending'
      });

      return thumbnailPath;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      // Return empty string if thumbnail generation fails - video will still work
      return '';
    }
  }

  async trimVideo(
    clip: VideoClip,
    startTime: number,
    endTime: number
  ): Promise<VideoClip> {
    const outputPath = path.join(
      path.dirname(clip.path),
      `trimmed_${path.basename(clip.path)}.mp4`
    );

    const operation = {
      id: generateId(),
      type: 'trim' as const,
      parameters: { startTime, endTime },
      inputFile: clip.path,
      outputFile: outputPath,
      status: 'pending' as const
    };

    await this.ffmpegService.executeOperation(operation);

    return {
      ...clip,
      path: outputPath,
      startTime: 0,
      endTime: endTime - startTime,
      duration: endTime - startTime
    };
  }

  async resizeVideo(
    clip: VideoClip,
    width: number,
    height: number
  ): Promise<VideoClip> {
    const outputPath = path.join(
      path.dirname(clip.path),
      `resized_${path.basename(clip.path)}.mp4`
    );

    const operation = {
      id: generateId(),
      type: 'resize' as const,
      parameters: { width, height },
      inputFile: clip.path,
      outputFile: outputPath,
      status: 'pending' as const
    };

    await this.ffmpegService.executeOperation(operation);

    return {
      ...clip,
      path: outputPath
    };
  }

  async addTextOverlay(
    clip: VideoClip,
    text: string,
    x: number,
    y: number,
    fontSize: number = 24,
    color: string = 'white'
  ): Promise<VideoClip> {
    const outputPath = path.join(
      path.dirname(clip.path),
      `overlay_${path.basename(clip.path)}.mp4`
    );

    const operation = {
      id: generateId(),
      type: 'overlay' as const,
      parameters: { text, x, y, fontSize, color },
      inputFile: clip.path,
      outputFile: outputPath,
      status: 'pending' as const
    };

    await this.ffmpegService.executeOperation(operation);

    return {
      ...clip,
      path: outputPath
    };
  }

  async adjustAudio(
    clip: VideoClip,
    volume: number
  ): Promise<VideoClip> {
    const outputPath = path.join(
      path.dirname(clip.path),
      `audio_${path.basename(clip.path)}.mp4`
    );

    const operation = {
      id: generateId(),
      type: 'audio' as const,
      parameters: { volume },
      inputFile: clip.path,
      outputFile: outputPath,
      status: 'pending' as const
    };

    await this.ffmpegService.executeOperation(operation);

    return {
      ...clip,
      path: outputPath
    };
  }

  async deleteVideo(clip: VideoClip): Promise<void> {
    try {
      await fs.unlink(clip.path);
      if (clip.thumbnail) {
        await fs.unlink(clip.thumbnail);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  }

  async getVideoDuration(filePath: string): Promise<number> {
    try {
      const videoInfo = await this.ffmpegService.getVideoInfo(filePath);
      return videoInfo.duration;
    } catch (error) {
      console.error('Error getting video duration:', error);
      return 0;
    }
  }

  async validateVideoFile(filePath: string): Promise<boolean> {
    try {
      await this.ffmpegService.getVideoInfo(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}
