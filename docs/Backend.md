# AI Video Editor - Backend Documentation

## Overview

The backend of the AI Video Editor is a Node.js Express server that provides RESTful APIs for video processing, project management, and AI integration. It serves as the bridge between the Electron frontend and the underlying video processing engine (FFmpeg) and AI service (Ollama).

## Architecture

### Backend Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Express       │    │   Service       │    │   External      │
│   Server        │◄──►│   Layer         │◄──►│   Services      │
│   (HTTP + WS)   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Route         │    │   Business      │    │   FFmpeg        │
│   Handlers      │    │   Logic         │    │   + Ollama      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Service Architecture

- **Express Server**: HTTP server with WebSocket support
- **Route Handlers**: API endpoint implementations
- **Service Layer**: Business logic and external service integration
- **Middleware**: Authentication, validation, and error handling
- **WebSocket Server**: Real-time communication for progress updates

## API Endpoints

### 1. Video Processing API

#### Upload Video
```http
POST /api/video/upload
Content-Type: multipart/form-data

Body:
- video: File (video file)
```

**Response**:
```json
{
  "success": true,
  "clip": {
    "id": "abc123",
    "name": "sample_video",
    "path": "/uploads/video-123.mp4",
    "startTime": 0,
    "endTime": 120,
    "duration": 120,
    "thumbnail": "/uploads/thumb_video-123.jpg"
  },
  "message": "Video uploaded successfully"
}
```

#### Get Video Info
```http
GET /api/video/info/:videoId
```

**Response**:
```json
{
  "duration": 120.5,
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "size": 52428800,
  "format": "mp4"
}
```

#### Process Video
```http
POST /api/video/process
Content-Type: application/json

Body:
{
  "inputPath": "/uploads/video-123.mp4",
  "outputPath": "/outputs/processed_video.mp4",
  "operations": [
    {
      "type": "trim",
      "parameters": {
        "startTime": 10,
        "endTime": 30
      }
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "result": {
    "success": true,
    "outputPath": "/outputs/processed_video.mp4",
    "duration": 20
  },
  "message": "Video processed successfully"
}
```

#### Get Processing Progress
```http
GET /api/video/progress/:operationId
```

**Response**:
```json
{
  "progress": 75
}
```

### 2. AI Assistant API

#### Process Chat Message
```http
POST /api/ai/chat
Content-Type: application/json

Body:
{
  "message": "Trim the first 10 seconds",
  "projectContext": {
    "duration": 120,
    "tracks": [...],
    "resolution": { "width": 1920, "height": 1080 }
  }
}
```

**Response**:
```json
{
  "success": true,
  "aiResponse": {
    "command": "Trim the first 10 seconds",
    "operation": {
      "id": "op123",
      "type": "trim",
      "parameters": {
        "startTime": 0,
        "endTime": 10
      },
      "inputFile": "",
      "outputFile": "",
      "status": "pending"
    },
    "confidence": 0.9
  },
  "ffmpegResult": {
    "success": true,
    "outputPath": "/outputs/trimmed_video.mp4",
    "duration": 10
  },
  "message": "Command processed successfully"
}
```

#### Get AI Status
```http
GET /api/ai/status
```

**Response**:
```json
{
  "status": "ready",
  "model": "llama3.1:8b",
  "available": true
}
```

#### Get Available Commands
```http
GET /api/ai/commands
```

**Response**:
```json
[
  "Trim video to specific time range",
  "Cut segment from video",
  "Resize video dimensions",
  "Add text overlay",
  "Adjust audio levels",
  "Add audio track",
  "Merge multiple clips"
]
```

#### Execute Specific Command
```http
POST /api/ai/execute
Content-Type: application/json

Body:
{
  "command": "trim",
  "parameters": {
    "startTime": 0,
    "endTime": 30
  }
}
```

**Response**:
```json
{
  "success": true,
  "operation": {
    "id": "op456",
    "type": "trim",
    "parameters": {
      "startTime": 0,
      "endTime": 30
    },
    "inputFile": "/uploads/video-123.mp4",
    "outputFile": "/outputs/trimmed_video.mp4",
    "status": "completed"
  },
  "result": {
    "success": true,
    "outputPath": "/outputs/trimmed_video.mp4",
    "duration": 30
  },
  "message": "Command executed successfully"
}
```

### 3. Project Management API

#### Create Project
```http
POST /api/project
Content-Type: application/json

Body:
{
  "name": "My Video Project",
  "resolution": {
    "width": 1920,
    "height": 1080
  },
  "fps": 30
}
```

**Response**:
```json
{
  "success": true,
  "project": {
    "id": "proj123",
    "name": "My Video Project",
    "tracks": [
      {
        "id": "track1",
        "name": "Video Track 1",
        "type": "video",
        "clips": [],
        "enabled": true
      },
      {
        "id": "track2",
        "name": "Audio Track 1",
        "type": "audio",
        "clips": [],
        "enabled": true
      }
    ],
    "duration": 0,
    "resolution": { "width": 1920, "height": 1080 },
    "fps": 30
  },
  "message": "Project created successfully"
}
```

#### Get Project
```http
GET /api/project/:projectId
```

**Response**:
```json
{
  "id": "proj123",
  "name": "My Video Project",
  "tracks": [...],
  "duration": 120,
  "resolution": { "width": 1920, "height": 1080 },
  "fps": 30
}
```

#### Update Project
```http
PUT /api/project/:projectId
Content-Type: application/json

Body:
{
  "name": "Updated Project Name",
  "duration": 150
}
```

**Response**:
```json
{
  "success": true,
  "project": {
    "id": "proj123",
    "name": "Updated Project Name",
    "tracks": [...],
    "duration": 150,
    "resolution": { "width": 1920, "height": 1080 },
    "fps": 30
  },
  "message": "Project updated successfully"
}
```

#### Delete Project
```http
DELETE /api/project/:projectId
```

**Response**:
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

#### Add Track
```http
POST /api/project/:projectId/tracks
Content-Type: application/json

Body:
{
  "name": "New Track",
  "type": "overlay"
}
```

**Response**:
```json
{
  "success": true,
  "track": {
    "id": "track3",
    "name": "New Track",
    "type": "overlay",
    "clips": [],
    "enabled": true
  },
  "message": "Track added successfully"
}
```

#### Remove Track
```http
DELETE /api/project/:projectId/tracks/:trackId
```

**Response**:
```json
{
  "success": true,
  "message": "Track removed successfully"
}
```

#### Export Project
```http
POST /api/project/:projectId/export
Content-Type: application/json

Body:
{
  "outputPath": "/exports/final_video.mp4",
  "format": "mp4"
}
```

**Response**:
```json
{
  "success": true,
  "result": {
    "success": true,
    "outputPath": "/exports/final_video.mp4"
  },
  "message": "Project exported successfully"
}
```

## Service Layer

### 1. VideoService

Handles video file operations and metadata extraction:

```typescript
export class VideoService {
  private ffmpegService: FFmpegService;

  constructor() {
    this.ffmpegService = new FFmpegService();
  }

  async getVideoInfo(filePath: string): Promise<VideoInfo> {
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

  async createVideoClip(filePath: string, videoInfo: VideoInfo): Promise<VideoClip> {
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

      await this.ffmpegService.executeOperation({
        id: generateId(),
        type: 'overlay',
        parameters: { time: 1 },
        inputFile: filePath,
        outputFile: thumbnailPath,
        status: 'pending'
      });

      return thumbnailPath;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return '';
    }
  }

  // Additional methods for video manipulation...
}
```

### 2. FFmpegService

Core video processing engine using FFmpeg:

```typescript
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

        case 'resize':
          const { width, height } = operation.parameters;
          if (width && height) {
            command = command.size(`${width}x${height}`);
          }
          break;

        // Additional operation types...
      }

      // Set output format and quality
      command
        .outputOptions(['-c:v libx264', '-c:a aac', '-preset fast'])
        .output(outputPath)
        .on('progress', (progress) => {
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
        .on('error', (error) => {
          reject(error);
        })
        .run();
    });
  }

  // Additional methods...
}
```

### 3. AIService

Integrates with Ollama for natural language processing:

```typescript
export class AIService {
  private ollama: Ollama;
  private modelName: string = 'llama3.1:8b';

  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434'
    });
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
        confidence: 0.8
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

  // Additional methods...
}
```

### 4. ProjectService

Manages video project persistence and operations:

```typescript
export class ProjectService {
  private projects: Map<string, VideoProject> = new Map();
  private projectsDir = 'projects';

  constructor() {
    this.ensureProjectsDirectory();
  }

  async createProject(
    name: string,
    resolution: { width: number; height: number } = { width: 1920, height: 1080 },
    fps: number = 30
  ): Promise<VideoProject> {
    const project = createEmptyProject(name);
    project.resolution = resolution;
    project.fps = fps;

    this.projects.set(project.id, project);
    await this.saveProject(project);

    return project;
  }

  async getProject(projectId: string): Promise<VideoProject | null> {
    if (this.projects.has(projectId)) {
      return this.projects.get(projectId)!;
    }

    // Try to load from disk
    try {
      const projectPath = path.join(this.projectsDir, `${projectId}.json`);
      const projectData = await fs.readFile(projectPath, 'utf-8');
      const project = JSON.parse(projectData) as VideoProject;

      // Convert date strings back to Date objects
      project.tracks.forEach(track => {
        track.clips.forEach(clip => {
          if (typeof clip.startTime === 'string') {
            clip.startTime = parseFloat(clip.startTime);
          }
          if (typeof clip.endTime === 'string') {
            clip.endTime = parseFloat(clip.endTime);
          }
          if (typeof clip.duration === 'string') {
            clip.duration = parseFloat(clip.duration);
          }
        });
      });

      this.projects.set(projectId, project);
      return project;
    } catch (error) {
      console.error('Error loading project:', error);
      return null;
    }
  }

  // Additional methods...
}
```

## WebSocket Integration

### Real-time Communication

The backend provides WebSocket support for real-time updates:

```typescript
export function setupWebSocket(wss: WebSocketServer): void {
  const clients = new Map<string, Client>();

  wss.on('connection', (ws: WebSocket) => {
    const clientId = generateClientId();
    const client: Client = { ws, id: clientId };
    clients.set(clientId, client);

    console.log(`🔌 WebSocket client connected: ${clientId}`);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      clientId,
      message: 'Connected to AI Video Editor'
    }));

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleWebSocketMessage(client, message, clients);
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      console.log(`🔌 WebSocket client disconnected: ${clientId}`);
    });
  });

  // Broadcast to all clients
  wss.broadcast = (message: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };

  // Broadcast to clients in specific project
  wss.broadcastToProject = (projectId: string, message: any) => {
    clients.forEach((client) => {
      if (client.projectId === projectId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  };
}
```

### WebSocket Message Types

#### Connection Messages
```typescript
interface ConnectionMessage {
  type: 'connection';
  clientId: string;
  message: string;
}
```

#### Project Join Messages
```typescript
interface ProjectJoinMessage {
  type: 'join_project';
  projectId: string;
}
```

#### Chat Messages
```typescript
interface ChatMessage {
  type: 'chat_message';
  id: string;
  content: string;
  timestamp: Date;
}
```

#### FFmpeg Progress Messages
```typescript
interface FFmpegProgressMessage {
  type: 'ffmpeg_progress';
  operationId: string;
  progress: number;
}
```

#### Timeline Update Messages
```typescript
interface TimelineUpdateMessage {
  type: 'timeline_update';
  projectId: string;
  tracks: TimelineTrack[];
}
```

## Error Handling

### 1. API Error Responses

Standardized error response format:

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

// Example error responses
{
  "success": false,
  "error": "Video file not found",
  "code": "VIDEO_NOT_FOUND",
  "details": {
    "filePath": "/uploads/missing_video.mp4"
  }
}

{
  "success": false,
  "error": "Invalid video format",
  "code": "INVALID_FORMAT",
  "details": {
    "supportedFormats": ["mp4", "avi", "mov", "mkv"]
  }
}
```

### 2. Error Middleware

Global error handling middleware:

```typescript
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);

  // Determine error type and response
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.message
    });
  }

  if (error.name === 'FFmpegError') {
    return res.status(500).json({
      success: false,
      error: 'Video processing failed',
      code: 'FFMPEG_ERROR',
      details: error.message
    });
  }

  if (error.name === 'AIError') {
    return res.status(500).json({
      success: false,
      error: 'AI processing failed',
      code: 'AI_ERROR',
      details: error.message
    });
  }

  // Generic error
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});
```

### 3. Service Error Handling

Service-level error handling:

```typescript
export class VideoService {
  async getVideoInfo(filePath: string): Promise<VideoInfo> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`Video file not found: ${filePath}`);
      }

      // Check file size
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        throw new Error(`Video file is empty: ${filePath}`);
      }

      // Get video metadata
      const videoInfo = await this.ffmpegService.getVideoInfo(filePath);

      return {
        ...videoInfo,
        size: stats.size,
        format: path.extname(filePath).substring(1)
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get video information: ${error.message}`);
      }
      throw new Error('Failed to get video information');
    }
  }
}
```

## Security Considerations

### 1. Input Validation

Validate all incoming requests:

```typescript
import { body, validationResult } from 'express-validator';

// Validation middleware
const validateVideoUpload = [
  body('video').custom((value, { req }) => {
    if (!req.file) {
      throw new Error('Video file is required');
    }

    // Check file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new Error('Invalid video format');
    }

    // Check file size (100MB limit)
    if (req.file.size > 100 * 1024 * 1024) {
      throw new Error('Video file too large (max 100MB)');
    }

    return true;
  })
];

// Apply validation
router.post('/upload', validateVideoUpload, upload.single('video'), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  // Process upload...
});
```

### 2. Path Sanitization

Prevent directory traversal attacks:

```typescript
import path from 'path';

function sanitizePath(filePath: string): string {
  // Resolve to absolute path
  const absolutePath = path.resolve(filePath);

  // Check if path is within allowed directory
  const uploadsDir = path.resolve('uploads');
  if (!absolutePath.startsWith(uploadsDir)) {
    throw new Error('Invalid file path');
  }

  return absolutePath;
}

// Usage
const safePath = sanitizePath(req.params.filePath);
```

### 3. Rate Limiting

Prevent API abuse:

```typescript
import rateLimit from 'express-rate-limit';

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});

// AI endpoint rate limiting (more restrictive)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 AI requests per windowMs
  message: {
    success: false,
    error: 'Too many AI requests, please try again later'
  }
});

// Apply rate limiters
app.use(generalLimiter);
app.use('/api/ai', aiLimiter);
```

## Performance Optimization

### 1. File Upload Optimization

Efficient file handling:

```typescript
import multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create date-based directory structure
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const uploadPath = path.join('uploads', String(year), month, day);
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});
```

### 2. Caching Strategy

Implement response caching:

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes default TTL

// Cache video info
app.get('/api/video/info/:videoId', async (req, res) => {
  const cacheKey = `video_info_${req.params.videoId}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const videoInfo = await videoService.getVideoInfo(req.params.videoId);

    // Cache the result
    cache.set(cacheKey, videoInfo, 300); // 5 minutes TTL

    res.json(videoInfo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get video info' });
  }
});
```

### 3. Database Optimization

For future database integration:

```typescript
// Connection pooling
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Query optimization
const getProjectWithTracks = async (projectId: string) => {
  const query = `
    SELECT p.*,
           json_agg(
             json_build_object(
               'id', t.id,
               'name', t.name,
               'type', t.type,
               'clips', COALESCE(t.clips, '[]'::json)
             )
           ) as tracks
    FROM projects p
    LEFT JOIN tracks t ON p.id = t.project_id
    WHERE p.id = $1
    GROUP BY p.id
  `;

  const result = await pool.query(query, [projectId]);
  return result.rows[0];
};
```

## Monitoring and Logging

### 1. Request Logging

Log all API requests:

```typescript
import morgan from 'morgan';

// Custom logging format
morgan.token('body', (req: any) => JSON.stringify(req.body));
morgan.token('response-time', (req: any, res: any) => {
  const time = morgan['response-time'](req, res);
  return time ? `${time}ms` : '';
});

const logFormat = ':method :url :status :response-time :body';

app.use(morgan(logFormat, {
  stream: {
    write: (message: string) => {
      console.log(message.trim());
    }
  }
}));
```

### 2. Performance Monitoring

Track API performance:

```typescript
import { performance } from 'perf_hooks';

// Performance middleware
app.use((req, res, next) => {
  const start = performance.now();

  res.on('finish', () => {
    const duration = performance.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration.toFixed(2)}ms`);

    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
    }
  });

  next();
});
```

### 3. Error Tracking

Comprehensive error logging:

```typescript
// Error logging middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    body: req.body,
    params: req.params,
    query: req.query
  };

  console.error('API Error:', JSON.stringify(errorInfo, null, 2));

  // Send to external error tracking service
  if (process.env.SENTRY_DSN) {
    // Sentry integration
  }

  next(error);
});
```

## Testing Strategy

### 1. Unit Testing

Test individual services:

```typescript
import { jest } from '@jest/globals';
import { VideoService } from '../services/videoService';

describe('VideoService', () => {
  let videoService: VideoService;
  let mockFFmpegService: any;

  beforeEach(() => {
    mockFFmpegService = {
      getVideoInfo: jest.fn(),
      executeOperation: jest.fn()
    };

    videoService = new VideoService();
    (videoService as any).ffmpegService = mockFFmpegService;
  });

  describe('getVideoInfo', () => {
    it('should return video information for valid file', async () => {
      const mockVideoInfo = {
        duration: 120,
        width: 1920,
        height: 1080,
        fps: 30
      };

      mockFFmpegService.getVideoInfo.mockResolvedValue(mockVideoInfo);

      const result = await videoService.getVideoInfo('/test/video.mp4');

      expect(result).toEqual({
        ...mockVideoInfo,
        size: expect.any(Number),
        format: 'mp4'
      });
    });

    it('should throw error for non-existent file', async () => {
      await expect(videoService.getVideoInfo('/nonexistent/video.mp4'))
        .rejects
        .toThrow('Failed to get video information');
    });
  });
});
```

### 2. Integration Testing

Test API endpoints:

```typescript
import request from 'supertest';
import { app } from '../app';

describe('Video API', () => {
  describe('POST /api/video/upload', () => {
    it('should upload video file successfully', async () => {
      const response = await request(app)
        .post('/api/video/upload')
        .attach('video', 'test/fixtures/sample.mp4')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.clip).toHaveProperty('id');
      expect(response.body.clip).toHaveProperty('path');
    });

    it('should reject non-video files', async () => {
      const response = await request(app)
        .post('/api/video/upload')
        .attach('video', 'test/fixtures/document.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only video files are allowed');
    });
  });
});
```

### 3. End-to-End Testing

Test complete workflows:

```typescript
describe('AI Video Editing Workflow', () => {
  it('should process AI command and update timeline', async () => {
    // 1. Create project
    const projectResponse = await request(app)
      .post('/api/project')
      .send({
        name: 'Test Project',
        resolution: { width: 1920, height: 1080 },
        fps: 30
      })
      .expect(200);

    const projectId = projectResponse.body.project.id;

    // 2. Upload video
    const uploadResponse = await request(app)
      .post('/api/video/upload')
      .attach('video', 'test/fixtures/sample.mp4')
      .expect(200);

    const clip = uploadResponse.body.clip;

    // 3. Send AI command
    const aiResponse = await request(app)
      .post('/api/ai/chat')
      .send({
        message: 'Trim the first 10 seconds',
        projectContext: { projectId, clip }
      })
      .expect(200);

    expect(aiResponse.body.success).toBe(true);
    expect(aiResponse.body.aiResponse.operation.type).toBe('trim');

    // 4. Verify project was updated
    const projectResponse2 = await request(app)
      .get(`/api/project/${projectId}`)
      .expect(200);

    expect(projectResponse2.body.tracks[0].clips).toHaveLength(1);
  });
});
```

## Deployment

### 1. Environment Configuration

Environment-specific settings:

```typescript
// config/environment.ts
export const config = {
  development: {
    port: 3001,
    host: 'localhost',
    cors: {
      origin: 'http://localhost:3000',
      credentials: true
    },
    uploads: {
      maxSize: 100 * 1024 * 1024, // 100MB
      allowedTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/mkv']
    },
    ai: {
      host: 'http://localhost:11434',
      model: 'llama3.1:8b',
      timeout: 30000
    }
  },
  production: {
    port: process.env.PORT || 3001,
    host: '0.0.0.0',
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    },
    uploads: {
      maxSize: 500 * 1024 * 1024, // 500MB
      allowedTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/mkv']
    },
    ai: {
      host: process.env.OLLAMA_HOST || 'http://localhost:11434',
      model: process.env.AI_MODEL || 'llama3.1:8b',
      timeout: 60000
    }
  }
};

export const currentConfig = config[process.env.NODE_ENV || 'development'];
```

### 2. Process Management

Production process management:

```typescript
// PM2 ecosystem file
module.exports = {
  apps: [{
    name: 'ai-video-editor-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10
  }]
};
```

### 3. Health Checks

Application health monitoring:

```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      ffmpeg: await checkFFmpegHealth(),
      ai: await checkAIHealth(),
      storage: await checkStorageHealth()
    }
  };

  const isHealthy = health.services.ffmpeg && health.services.ai && health.services.storage;

  res.status(isHealthy ? 200 : 503).json(health);
});

async function checkFFmpegHealth(): Promise<boolean> {
  try {
    // Check if FFmpeg is available
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('ffmpeg -version', (error: any) => {
        resolve(!error);
      });
    });
  } catch {
    return false;
  }
}

async function checkAIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${config.ai.host}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

async function checkStorageHealth(): Promise<boolean> {
  try {
    const stats = await fs.stat('uploads');
    return stats.isDirectory();
  } catch {
    return false;
  }
}
```

## Future Enhancements

### 1. Advanced Video Processing

- **GPU Acceleration**: CUDA/OpenCL support for faster processing
- **Batch Processing**: Process multiple videos simultaneously
- **Video Effects**: Advanced filters and effects
- **Audio Processing**: Enhanced audio manipulation capabilities

### 2. AI Improvements

- **Multi-modal AI**: Video content understanding
- **Custom Models**: Fine-tuned models for video editing
- **Learning**: AI learns from user preferences
- **Automation**: Automatic editing suggestions

### 3. Scalability

- **Microservices**: Break down into smaller services
- **Load Balancing**: Distribute processing across multiple servers
- **Queue System**: Background job processing
- **Caching**: Redis for improved performance

### 4. Monitoring and Analytics

- **Metrics Dashboard**: Real-time performance monitoring
- **User Analytics**: Track usage patterns
- **Performance Profiling**: Identify bottlenecks
- **Alerting**: Proactive issue detection
