import { Router } from 'express';
import { AIService } from '../services/aiService';
import { FFmpegService } from '../services/ffmpegService';
import { ChatMessage, AICommand } from '@ai-video-editor/shared';

const router = Router();
const aiService = new AIService();
const ffmpegService = new FFmpegService();

// Process chat message and generate FFmpeg command
router.post('/chat', async (req, res) => {
  try {
    const { message, projectContext } = req.body;

    // Generate AI response and FFmpeg command
    const aiResponse = await aiService.processMessage(message, projectContext);

    // If we have project context with video files, execute the operation
    if (aiResponse.operation && projectContext && projectContext.videoTracks && projectContext.videoTracks.length > 0) {
      try {
        // Get the first video track's file
        const videoTrack = projectContext.videoTracks[0];
        const inputFile = videoTrack.path || videoTrack.filePath;

        if (inputFile) {
          // Set the input file for the operation
          aiResponse.operation.inputFile = inputFile;

          // Execute the FFmpeg operation with file renaming strategy
          console.log(`🎬 AI Chat: Executing operation on video: ${inputFile}`);

          // Use processVideo instead of executeOperation to get file renaming
          const inputPath = inputFile;
          const outputPath = ffmpegService.generateOutputPath(inputFile, aiResponse.operation.type);

          console.log(`🎬 AI Chat: Processing video with renaming strategy`);
          console.log(`🎬 AI Chat: Input path: ${inputPath}`);
          console.log(`🎬 AI Chat: Output path: ${outputPath}`);

          const result = await ffmpegService.processVideo(inputPath, outputPath, [aiResponse.operation]);

          if (result.success) {
            // With our new file renaming strategy, the processed video is now available
            // at the original input path, so we return that path
            console.log(`✅ AI Chat: FFmpeg operation completed, processed video available at: ${result.outputPath}`);

            res.json({
              success: true,
              aiResponse: {
                ...aiResponse,
                ffmpegResult: result.outputPath, // This is now the original path with processed video
                operation: aiResponse.operation
              },
              message: 'Command processed and executed successfully'
            });
          } else {
            console.error(`❌ AI Chat: FFmpeg processing failed:`, result.error);
            res.json({
              success: true,
              aiResponse,
              error: `AI response generated, but FFmpeg processing failed: ${result.error}`,
              message: 'Command parsed but processing failed'
            });
          }
        } else {
          res.json({
            success: true,
            aiResponse,
            message: 'AI response generated, but no video file found to process'
          });
        }
      } catch (ffmpegError) {
        console.error('FFmpeg execution error:', ffmpegError);
        res.json({
          success: true,
          aiResponse,
          error: `AI response generated, but FFmpeg execution failed: ${ffmpegError instanceof Error ? ffmpegError.message : 'Unknown error'}`,
          message: 'Command parsed but execution failed'
        });
      }
    } else {
      // Return the AI response with the parsed operation
      res.json({
        success: true,
        aiResponse,
        message: 'AI response generated successfully'
      });
    }
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process AI chat' });
  }
});

// Get AI model status
router.get('/status', async (req, res) => {
  try {
    const status = await aiService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('AI status error:', error);
    res.status(500).json({ error: 'Failed to get AI status' });
  }
});

// Get available AI commands
router.get('/commands', async (req, res) => {
  try {
    const commands = await aiService.getAvailableCommands();
    res.json(commands);
  } catch (error) {
    console.error('Get commands error:', error);
    res.status(500).json({ error: 'Failed to get available commands' });
  }
});

// Execute specific AI command
router.post('/execute', async (req, res) => {
  try {
    const { command, parameters } = req.body;

    const operation = await aiService.generateOperation(command, parameters);
    const result = await ffmpegService.executeOperation(operation);

    res.json({
      success: true,
      operation,
      result,
      message: 'Command executed successfully'
    });
  } catch (error) {
    console.error('Execute command error:', error);
    res.status(500).json({ error: 'Failed to execute command' });
  }
});

export { router as aiRoutes };
