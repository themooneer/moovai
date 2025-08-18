import { Ollama } from 'ollama';
import { ChatMessage, AICommand, FFmpegOperation } from '@ai-video-editor/shared';
import { generateId } from '@ai-video-editor/shared';

export class AIService {
  private ollama: Ollama;
  private modelName: string = 'llama3.1:8b'; // Default model

  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434'
    });
  }

  async getStatus(): Promise<{ status: string; model: string; available: boolean }> {
    try {
      const models = await this.ollama.list();
      const model = models.models.find(m => m.name === this.modelName);

      return {
        status: 'ready',
        model: this.modelName,
        available: !!model
      };
    } catch (error) {
      return {
        status: 'error',
        model: this.modelName,
        available: false
      };
    }
  }

  async processMessage(message: string, projectContext?: any): Promise<AICommand> {
    try {
      const prompt = this.buildPrompt(message, projectContext);

      const response = await this.ollama.chat({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const aiResponse = response.message.content;
      const operation = this.parseAIResponse(aiResponse, message);

      return {
        command: message,
        operation,
        confidence: 0.8 // Default confidence
      };
    } catch (error) {
      console.error('AI processing error:', error);
      throw new Error('Failed to process AI message');
    }
  }

  private getSystemPrompt(): string {
    return `You are an AI video editing assistant. Your job is to translate natural language commands into FFmpeg operations.

Available operations:
- TRIM: Cut video to specific time range
- CUT: Remove a segment from video
- RESIZE: Change video dimensions
- OVERLAY: Add text or image overlay
- AUDIO: Adjust audio levels or add audio

Respond with JSON in this format:
{
  "operation": "TRIM",
  "parameters": {
    "startTime": 10,
    "endTime": 30
  },
  "description": "Trimmed video from 10s to 30s"
}

Only respond with valid JSON.`;
  }

  private buildPrompt(message: string, projectContext?: any): string {
    let prompt = `User command: "${message}"`;

    if (projectContext) {
      prompt += `\n\nProject context: ${JSON.stringify(projectContext)}`;
    }

    prompt += '\n\nGenerate the appropriate FFmpeg operation:';
    return prompt;
  }

  private parseAIResponse(aiResponse: string, originalCommand: string): FFmpegOperation {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(aiResponse);

      return {
        id: generateId(),
        type: this.mapOperationType(parsed.operation),
        parameters: parsed.parameters || {},
        inputFile: '', // Will be set by caller
        outputFile: '', // Will be set by caller
        status: 'pending'
      };
    } catch (error) {
      // Fallback to command parsing
      return this.fallbackCommandParsing(originalCommand);
    }
  }

  private mapOperationType(operation: string): FFmpegOperation['type'] {
    const typeMap: Record<string, FFmpegOperation['type']> = {
      'TRIM': 'trim',
      'CUT': 'cut',
      'RESIZE': 'resize',
      'OVERLAY': 'overlay',
      'AUDIO': 'audio'
    };

    return typeMap[operation.toUpperCase()] || 'trim';
  }

  private fallbackCommandParsing(command: string): FFmpegOperation {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('trim') || lowerCommand.includes('cut')) {
      return {
        id: generateId(),
        type: 'trim',
        parameters: { startTime: 0, endTime: 10 },
        inputFile: '',
        outputFile: '',
        status: 'pending'
      };
    }

    if (lowerCommand.includes('resize')) {
      return {
        id: generateId(),
        type: 'resize',
        parameters: { width: 1280, height: 720 },
        inputFile: '',
        outputFile: '',
        status: 'pending'
      };
    }

    // Default to trim operation
    return {
      id: generateId(),
      type: 'trim',
      parameters: { startTime: 0, endTime: 10 },
      inputFile: '',
      outputFile: '',
      status: 'pending'
    };
  }

  async generateOperation(command: string, parameters: any): Promise<FFmpegOperation> {
    return {
      id: generateId(),
      type: 'trim',
      parameters,
      inputFile: '',
      outputFile: '',
      status: 'pending'
    };
  }

  async getAvailableCommands(): Promise<string[]> {
    return [
      'Trim video to specific time range',
      'Cut segment from video',
      'Resize video dimensions',
      'Add text overlay',
      'Adjust audio levels',
      'Add audio track',
      'Merge multiple clips'
    ];
  }
}
