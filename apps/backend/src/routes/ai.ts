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

    // If AI generated a command, execute it
    if (aiResponse.command && aiResponse.operation) {
      const result = await ffmpegService.executeOperation(aiResponse.operation);

      res.json({
        success: true,
        aiResponse,
        ffmpegResult: result,
        message: 'Command processed successfully'
      });
    } else {
      res.json({
        success: true,
        aiResponse,
        message: 'AI response generated'
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
