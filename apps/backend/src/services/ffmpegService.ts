import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { promises as fs } from 'fs';
import path from 'path';
import { FFmpegOperation, VideoProcessingResult } from '@ai-video-editor/shared';
import { generateId } from '@ai-video-editor/shared';

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export class FFmpegService {
  private operations: Map<string, FFmpegOperation> = new Map();

  async processVideo(
    inputPath: string,
    outputPath: string,
    operations: FFmpegOperation[]
  ): Promise<VideoProcessingResult> {
    try {
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

      return {
        success: true,
        outputPath: currentOutput,
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

    try {
      const result = await this.executeFFmpegCommand(operation, inputFile, outputFile);

      // Update operation status
      operation.status = 'completed';
      operation.progress = 100;
      this.operations.set(operationId, operation);

      return outputFile;
    } catch (error) {
      // Update operation status
      operation.status = 'error';
      this.operations.set(operationId, operation);
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
          }
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error: any) => {
          reject(error);
        })
        .run();
    });
  }

  private generateOutputPath(inputPath: string, operationType: string): string {
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, path.extname(inputPath));
    const timestamp = Date.now();
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
}
