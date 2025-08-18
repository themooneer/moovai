# AI Video Editor - AI Agent Documentation

## Overview

The AI Agent is the core intelligence layer that translates natural language commands into executable FFmpeg operations. It acts as a bridge between human language and video processing, making video editing accessible to users without technical knowledge of video processing commands.

## Architecture

### AI Agent Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │    │   AI Agent      │    │   FFmpeg        │
│   (Natural      │───►│   (Ollama +     │───►│   Operations    │
│   Language)     │    │    Llama 3.1)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chat          │    │   Command       │    │   Video         │
│   Interface     │    │   Parser        │    │   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## AI Model Integration

### Ollama Setup

The AI Agent uses Ollama to run the Llama 3.1 8B model locally:

```typescript
import { Ollama } from 'ollama';

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://localhost:11434'
});
```

**Model Configuration**:
- **Model**: `llama3.1:8b` (8 billion parameters)
- **Host**: Local Ollama server (default: localhost:11434)
- **Context Window**: 4096 tokens
- **Temperature**: 0.7 (balanced creativity and accuracy)

### Model Selection Rationale

**Why Llama 3.1 8B**:
- **Size**: Small enough to run on consumer hardware
- **Quality**: Good performance for command interpretation
- **License**: Open source with permissive licensing
- **Speed**: Fast inference for real-time interaction
- **Accuracy**: Sufficient for video editing commands

**Alternative Models**:
- **Mistral 7B**: Similar performance, slightly different architecture
- **Code Llama**: Specialized for code but overkill for this use case
- **GPT-4**: Best quality but requires cloud API and costs

## Command Processing Pipeline

### 1. Input Processing

```typescript
async processMessage(message: string, projectContext?: any): Promise<AICommand> {
  const prompt = this.buildPrompt(message, projectContext);

  const response = await this.ollama.chat({
    model: this.modelName,
    messages: [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt }
    ]
  });

  const aiResponse = response.message.content;
  const operation = this.parseAIResponse(aiResponse, message);

  return {
    command: message,
    operation,
    confidence: 0.8
  };
}
```

### 2. System Prompt Engineering

The system prompt is carefully crafted to ensure consistent, structured responses:

```typescript
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
```

### 3. Context-Aware Prompting

The AI receives project context to make informed decisions:

```typescript
private buildPrompt(message: string, projectContext?: any): string {
  let prompt = `User command: "${message}"`;

  if (projectContext) {
    prompt += `\n\nProject context: ${JSON.stringify(projectContext)}`;
  }

  prompt += '\n\nGenerate the appropriate FFmpeg operation:';
  return prompt;
}
```

**Context Information**:
- **Project Duration**: Total video length
- **Current Tracks**: Available video and audio tracks
- **Clip Information**: Existing clips and their properties
- **Resolution**: Video dimensions and frame rate
- **Recent Operations**: History of previous edits

## Command Translation

### Supported Operations

#### 1. TRIM Operation
**Purpose**: Cut video to specific time range
**Natural Language Examples**:
- "Trim the first 10 seconds"
- "Keep only the middle section from 30s to 1m 30s"
- "Cut from 2 minutes to the end"

**FFmpeg Translation**:
```typescript
case 'trim':
  const { startTime = 0, endTime } = operation.parameters;
  if (endTime) {
    command = command
      .setStartTime(startTime)
      .setDuration(endTime - startTime);
  }
  break;
```

#### 2. CUT Operation
**Purpose**: Remove segments from video
**Natural Language Examples**:
- "Remove the section from 45s to 1m 15s"
- "Cut out the middle part"
- "Delete the first 30 seconds"

**FFmpeg Translation**:
```typescript
case 'cut':
  const { cutStart, cutEnd } = operation.parameters;
  if (cutStart !== undefined && cutEnd !== undefined) {
    command = command
      .setStartTime(cutStart)
      .setDuration(cutEnd - cutStart);
  }
  break;
```

#### 3. RESIZE Operation
**Purpose**: Change video dimensions
**Natural Language Examples**:
- "Resize to 720p"
- "Make it square (1:1 aspect ratio)"
- "Scale down to 1280x720"

**FFmpeg Translation**:
```typescript
case 'resize':
  const { width, height } = operation.parameters;
  if (width && height) {
    command = command.size(`${width}x${height}`);
  }
  break;
```

#### 4. OVERLAY Operation
**Purpose**: Add text or image overlays
**Natural Language Examples**:
- "Add text 'Hello World' at the top"
- "Put a logo in the bottom right corner"
- "Add watermark in the center"

**FFmpeg Translation**:
```typescript
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
```

#### 5. AUDIO Operation
**Purpose**: Adjust audio properties
**Natural Language Examples**:
- "Turn up the volume"
- "Mute the audio"
- "Add background music"

**FFmpeg Translation**:
```typescript
case 'audio':
  const { volume, audioPath } = operation.parameters;
  if (volume !== undefined) {
    command = command.audioFilters(`volume=${volume}`);
  }
  if (audioPath) {
    command = command.input(audioPath);
  }
  break;
```

### Parameter Extraction

The AI extracts relevant parameters from natural language:

```typescript
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
```

## Fallback Mechanisms

### 1. JSON Parsing Fallback

When the AI fails to generate valid JSON, the system falls back to pattern matching:

```typescript
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
```

### 2. Confidence Scoring

Each AI response includes a confidence score:

```typescript
return {
  command: message,
  operation,
  confidence: 0.8 // Default confidence
};
```

**Confidence Levels**:
- **0.9-1.0**: High confidence, execute immediately
- **0.7-0.8**: Medium confidence, execute with user confirmation
- **0.5-0.6**: Low confidence, ask for clarification
- **0.0-0.4**: Very low confidence, fallback to manual mode

## Error Handling

### 1. AI Service Failures

When the AI service is unavailable:

```typescript
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
```

### 2. Invalid Commands

When the AI generates invalid operations:

```typescript
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
```

## Performance Optimization

### 1. Model Loading

- **Lazy Loading**: Load model only when needed
- **Model Caching**: Keep model in memory during session
- **Batch Processing**: Process multiple commands together when possible

### 2. Response Caching

```typescript
private commandCache = new Map<string, FFmpegOperation>();

async processMessage(message: string, projectContext?: any): Promise<AICommand> {
  const cacheKey = `${message}_${JSON.stringify(projectContext)}`;

  if (this.commandCache.has(cacheKey)) {
    return this.commandCache.get(cacheKey)!;
  }

  // Process with AI and cache result
  const result = await this.processWithAI(message, projectContext);
  this.commandCache.set(cacheKey, result);

  return result;
}
```

## Training and Fine-tuning

### 1. Prompt Engineering

**Current Approach**: Zero-shot learning with carefully crafted prompts
**Future Improvements**:
- **Few-shot Learning**: Include examples in prompts
- **Chain-of-thought**: Break complex commands into steps
- **Context Learning**: Learn from user's editing patterns

### 2. Model Fine-tuning

**Potential Improvements**:
- **Domain-specific Training**: Fine-tune on video editing commands
- **User Feedback**: Learn from successful/failed operations
- **Command Patterns**: Identify common editing workflows

## Integration with FFmpeg

### 1. Command Generation

The AI generates structured operations that map directly to FFmpeg commands:

```typescript
interface FFmpegOperation {
  id: string;
  type: 'trim' | 'cut' | 'resize' | 'overlay' | 'audio';
  parameters: Record<string, any>;
  inputFile: string;
  outputFile: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
}
```

### 2. Execution Pipeline

```typescript
async executeOperation(operation: FFmpegOperation): Promise<string> {
  const operationId = operation.id;
  const inputFile = operation.inputFile;
  const outputFile = operation.outputFile;

  // Update operation status
  operation.status = 'processing';
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
```

## User Experience Features

### 1. Command Suggestions

The AI provides helpful suggestions for common operations:

```typescript
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
```

### 2. Progressive Disclosure

- **Simple Commands**: Basic operations like trim and resize
- **Advanced Commands**: Complex operations like overlays and effects
- **Custom Commands**: User-defined operations and workflows

### 3. Learning and Adaptation

- **Command History**: Remember successful commands
- **User Preferences**: Learn preferred editing styles
- **Error Recovery**: Suggest alternatives when operations fail

## Future Enhancements

### 1. Multi-modal AI

- **Video Understanding**: Analyze video content for automatic editing
- **Audio Analysis**: Understand audio patterns and content
- **Scene Detection**: Automatic scene boundary detection

### 2. Advanced Operations

- **Style Transfer**: Apply artistic styles to videos
- **Object Tracking**: Follow objects across frames
- **Face Recognition**: Identify and track faces

### 3. Workflow Automation

- **Batch Processing**: Apply same edits to multiple videos
- **Template Creation**: Save and reuse editing workflows
- **Smart Suggestions**: AI-generated editing recommendations

## Monitoring and Analytics

### 1. Command Success Rates

Track which types of commands are most successful:

```typescript
interface CommandMetrics {
  commandType: string;
  successRate: number;
  averageConfidence: number;
  commonFailures: string[];
  userSatisfaction: number;
}
```

### 2. Performance Metrics

- **Response Time**: How quickly the AI generates commands
- **Accuracy**: How often commands produce expected results
- **User Satisfaction**: Feedback on AI-generated operations

### 3. Continuous Improvement

- **A/B Testing**: Test different prompt strategies
- **User Feedback**: Collect and analyze user responses
- **Model Updates**: Integrate improved AI models as they become available
