import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import { FFmpegOperation, VideoProcessingResult } from '@ai-video-editor/shared';
import { generateId } from '@ai-video-editor/shared';
import { getWebSocketServer } from '../websocket';

// Check if system FFmpeg is available, otherwise fall back to static version
try {
  // Try to use system FFmpeg first
  const { execSync } = require('child_process');
  execSync('ffmpeg -version', { stdio: 'ignore' });
  execSync('ffprobe -version', { stdio: 'ignore' });
  console.log('✅ Using system-installed FFmpeg');
} catch (error) {
  // Fall back to static FFmpeg if system version is not available
  try {
    const ffmpegStatic = require('ffmpeg-static');
    if (ffmpegStatic) {
      ffmpeg.setFfmpegPath(ffmpegStatic);
      console.log('⚠️  Using static FFmpeg (system version not found)');
    }
  } catch (staticError) {
    console.error('❌ No FFmpeg available - video processing will fail');
  }
}

export class FFmpegService {
  private operations: Map<string, FFmpegOperation> = new Map();

  async processVideo(
    inputPath: string,
    outputPath: string,
    operations: FFmpegOperation[]
  ): Promise<VideoProcessingResult> {
    try {
      console.log('🎬 FFmpegService: processVideo called with file renaming strategy');
      console.log('🎬 FFmpegService: Input path:', inputPath);
      console.log('🎬 FFmpegService: Output path:', outputPath);
      console.log('🎬 FFmpegService: Operations:', operations.map(op => op.type));

      // Store original input path for renaming later
      const originalInputPath = inputPath;

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Process each operation sequentially
      let currentInput = inputPath;
      let currentOutput = outputPath;

      for (const operation of operations) {
        currentOutput = await this.executeOperation(operation, currentInput);
        currentInput = currentOutput;
      }

      // Get final video info
      const videoInfo = await this.getVideoInfo(currentOutput);

      // Implement file renaming strategy
      console.log('🎬 FFmpegService: About to call file renaming strategy');
      await this.renameFilesAfterProcessing(originalInputPath, currentOutput);
      console.log('🎬 FFmpegService: File renaming strategy completed');

      return {
        success: true,
        outputPath: originalInputPath, // Return the original path since we renamed the file
        duration: videoInfo.duration
      };
    } catch (error) {
      console.error('Video processing error:', error);
      return {
        success: false,
        outputPath: '',
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async executeOperation(
    operation: FFmpegOperation,
    inputPath?: string
  ): Promise<string> {
    const operationId = operation.id;
    const inputFile = inputPath || operation.inputFile;
    const outputFile = operation.outputFile || this.generateOutputPath(inputFile, operation.type);

    // Update operation status
    operation.status = 'processing';
    operation.inputFile = inputFile;
    operation.outputFile = outputFile;
    this.operations.set(operationId, operation);

    // Emit WebSocket update for operation start
    this.emitWebSocketUpdate(operation);

    try {
      const result = await this.executeFFmpegCommand(operation, inputFile, outputFile);

      // Update operation status
      operation.status = 'completed';
      operation.progress = 100;
      this.operations.set(operationId, operation);

      // Emit WebSocket update for operation completion
      this.emitWebSocketUpdate(operation);

      return outputFile;
    } catch (error) {
      // Update operation status
      operation.status = 'error';
      this.operations.set(operationId, operation);

      // Emit WebSocket update for operation error
      this.emitWebSocketUpdate(operation);
      throw error;
    }
  }

  private async executeFFmpegCommand(
    operation: FFmpegOperation,
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);



      // Apply operation-specific filters
      switch (operation.type) {
        case 'trim':
          const { startTime = 0, endTime } = operation.parameters;
          if (endTime) {
            command = command
              .setStartTime(startTime)
              .setDuration(endTime - startTime);
          }
          break;

        case 'cut':
          const { cutStart, cutEnd } = operation.parameters;
          if (cutStart !== undefined && cutEnd !== undefined) {
            command = command
              .setStartTime(cutStart)
              .setDuration(cutEnd - cutStart);
          }
          break;

        case 'resize':
          const { width, height } = operation.parameters;
          if (width && height) {
            command = command.size(`${width}x${height}`);
          }
          break;

        case 'overlay':
          const { overlayPath, x, y } = operation.parameters;
          if (overlayPath) {
            command = command
              .input(overlayPath)
              .complexFilter([
                `[0:v][1:v]overlay=${x || 0}:${y || 0}[out]`
              ])
              .map('[out]');
          }
          break;

        case 'audio':
          const { volume, audioPath } = operation.parameters;
          if (volume !== undefined) {
            command = command.audioFilters(`volume=${volume}`);
          }
          if (audioPath) {
            command = command.input(audioPath);
          }
          break;

        case 'thumbnail':
          const { time = 1 } = operation.parameters;
          // Extract a single frame at the specified time
          command = command
            .seekInput(time)
            .frames(1)
            .outputOptions(['-vcodec mjpeg', '-q:v 2']);
          break;
      }

      // Set output format and quality
      command
        .outputOptions(['-c:v libx264', '-c:a aac', '-preset fast'])
        .output(outputPath)
        .on('progress', (progress: any) => {
          // Update operation progress
          const op = this.operations.get(operation.id);
          if (op) {
            op.progress = Math.round((progress.percent || 0));
            this.operations.set(operation.id, op);
            console.log(`FFmpeg progress for operation ${operation.id}: ${op.progress}%`);

            // Emit WebSocket update
            this.emitWebSocketUpdate(op);
          }
        })
        .on('end', async () => {
          // Mark operation as completed
          const op = this.operations.get(operation.id);
          if (op) {
            op.status = 'completed';
            op.progress = 100;
            this.operations.set(operation.id, op);

            // Get video info for the completed operation
            try {
              const videoInfo = await this.getVideoInfo(outputPath);

              // Emit completion notification with video info
              this.emitWebSocketUpdate(op);
              this.emitWebSocketCompletion(operation, outputPath, videoInfo);
            } catch (error) {
              console.error('Failed to get video info for completed operation:', error);
              // Still emit completion notification
              this.emitWebSocketUpdate(op);
              this.emitWebSocketCompletion(operation, outputPath);
            }
          }
          resolve();
        })
        .on('error', (error: any) => {
          // Mark operation as failed
          const op = this.operations.get(operation.id);
          if (op) {
            op.status = 'error';
            this.operations.set(operation.id, op);

            // Emit error notification
            this.emitWebSocketUpdate(op);
          }
          reject(error);
        })
        .run();
    });
  }

  generateOutputPath(inputPath: string, operationType: string): string {
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, path.extname(inputPath));
    const timestamp = Date.now();
    // Format: name_operationType_timestamp.mp4
    return path.join(dir, `${name}_${operationType}_${timestamp}.mp4`);
  }

  async getVideoInfo(filePath: string): Promise<{ duration: number; width: number; height: number; fps: number }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (error: any, metadata: any) => {
        if (error) {
          reject(error);
          return;
        }

        const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps: this.parseFPS(videoStream.r_frame_rate || '0/1')
        });
      });
    });
  }

  private parseFPS(fpsString: string): number {
    const [num, den] = fpsString.split('/').map(Number);
    return den ? num / den : 0;
  }

  getProgress(operationId: string): number {
    const operation = this.operations.get(operationId);
    return operation?.progress || 0;
  }

  getOperation(operationId: string): FFmpegOperation | undefined {
    return this.operations.get(operationId);
  }

  getAllOperations(): FFmpegOperation[] {
    return Array.from(this.operations.values());
  }

  private emitWebSocketUpdate(operation: FFmpegOperation): void {
    const wss = getWebSocketServer();
    if (wss) {
      wss.broadcast({
        type: 'ffmpeg_progress',
        operationId: operation.id,
        operation: operation,
        progress: operation.progress,
        status: operation.status
      });
    }
  }

  private emitWebSocketCompletion(operation: FFmpegOperation, outputPath: string, videoInfo?: { duration: number; width: number; height: number; fps: number }): void {
    const wss = getWebSocketServer();
    if (wss) {
      wss.broadcast({
        type: 'ffmpeg_completed',
        operationId: operation.id,
        operationType: operation.type,
        outputPath: outputPath,
        success: true,
        timestamp: new Date().toISOString(),
        videoInfo: videoInfo || {}
      });
    }
  }

  private async renameFilesAfterProcessing(originalInputPath: string, newOutputPath: string): Promise<void> {
    try {
      console.log('🎬 FFmpegService: Starting file renaming strategy');
      console.log('🎬 FFmpegService: Original path:', originalInputPath);
      console.log('🎬 FFmpegService: New output path:', newOutputPath);

      // Check if both files exist
      const originalExists = await fs.access(originalInputPath).then(() => true).catch(() => false);
      const newExists = await fs.access(newOutputPath).then(() => true).catch(() => false);

      if (!originalExists) {
        console.warn('🎬 FFmpegService: Original file does not exist:', originalInputPath);
        return;
      }

      if (!newExists) {
        console.warn('🎬 FFmpegService: New processed file does not exist:', newOutputPath);
        return;
      }

      // Create backup path for original file
      const originalDir = path.dirname(originalInputPath);
      const originalName = path.basename(originalInputPath, path.extname(originalInputPath));
      const originalExt = path.extname(originalInputPath);
      const backupPath = path.join(originalDir, `${originalName}_old${originalExt}`);

      // Step 1: Rename original file to backup
      console.log('🎬 FFmpegService: Renaming original to backup:', backupPath);
      await fs.rename(originalInputPath, backupPath);

      // Step 2: Rename new processed file to original name
      console.log('🎬 FFmpegService: Renaming new file to original name:', originalInputPath);
      await fs.rename(newOutputPath, originalInputPath);

      // Step 3: Clean up backup file
      console.log('🎬 FFmpegService: Cleaning up backup file');
      await fs.unlink(backupPath);

      console.log('✅ FFmpegService: File renaming completed successfully');
      console.log('✅ FFmpegService: New video is now available at:', originalInputPath);
    } catch (error) {
      console.error('❌ FFmpegService: Error during file renaming:', error);
      // Don't throw error - let the process continue
    }
  }
}
