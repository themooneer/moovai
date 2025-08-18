# AI Video Editor - Coding Conventions and Guidelines

## Overview

This document outlines the coding standards, naming conventions, and best practices for the AI Video Editor project. Following these conventions ensures code consistency, maintainability, and team collaboration.

## General Principles

### 1. Code Quality
- **Readability**: Code should be self-documenting and easy to understand
- **Maintainability**: Write code that's easy to modify and extend
- **Consistency**: Follow established patterns throughout the codebase
- **Performance**: Consider performance implications, especially for video processing
- **Security**: Always validate inputs and handle errors gracefully

### 2. DRY (Don't Repeat Yourself)
- Extract common functionality into reusable functions
- Use shared types and interfaces across packages
- Implement utility functions for common operations
- Avoid duplicating business logic

### 3. Single Responsibility
- Each function should have one clear purpose
- Classes should represent a single concept
- Modules should focus on a specific domain
- Keep functions small and focused

## TypeScript Conventions

### 1. Type Definitions

#### Interface Naming
```typescript
// Use PascalCase for interfaces
interface VideoClip {
  id: string;
  name: string;
  path: string;
  startTime: number;
  endTime: number;
  duration: number;
  thumbnail?: string; // Optional properties use ?
}

// Use descriptive names that indicate purpose
interface FFmpegOperation {
  id: string;
  type: 'trim' | 'cut' | 'resize' | 'overlay' | 'audio';
  parameters: Record<string, any>;
  inputFile: string;
  outputFile: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
}

// Use union types for constrained values
type VideoFormat = 'mp4' | 'avi' | 'mov' | 'mkv';
type TrackType = 'video' | 'audio' | 'overlay';
type OperationStatus = 'pending' | 'processing' | 'completed' | 'error';
```

#### Type Aliases
```typescript
// Use type aliases for complex types
type Resolution = {
  width: number;
  height: number;
};

type VideoInfo = {
  duration: number;
  width: number;
  height: number;
  fps: number;
  size: number;
  format: string;
};

// Use generics for reusable types
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
```

### 2. Function Signatures

#### Parameter Types
```typescript
// Always specify parameter types
function processVideo(
  inputPath: string,
  outputPath: string,
  operations: FFmpegOperation[]
): Promise<VideoProcessingResult> {
  // Implementation
}

// Use interfaces for complex parameters
function createProject(
  name: string,
  options: {
    resolution?: Resolution;
    fps?: number;
    description?: string;
  } = {}
): VideoProject {
  // Implementation
}

// Use rest parameters for variable arguments
function combineVideos(
  baseVideo: string,
  ...overlayVideos: string[]
): Promise<string> {
  // Implementation
}
```

#### Return Types
```typescript
// Always specify return types
async function getVideoInfo(filePath: string): Promise<VideoInfo> {
  // Implementation
}

// Use union types for different return scenarios
function parseTimeInput(input: string): number | null {
  // Implementation
}

// Use void for functions that don't return values
function logError(error: Error): void {
  console.error('Error:', error.message);
}
```

### 3. Generic Types

#### Reusable Components
```typescript
// Generic interfaces for reusable patterns
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Generic utility types
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Generic constraints
interface HasId {
  id: string;
}

function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}
```

## Naming Conventions

### 1. Variables and Functions

#### camelCase for Variables and Functions
```typescript
// Variables
const videoPath = '/uploads/video.mp4';
const maxFileSize = 100 * 1024 * 1024;
const isProcessing = false;

// Functions
function getVideoDuration(filePath: string): number {
  // Implementation
}

async function uploadVideo(file: File): Promise<VideoClip> {
  // Implementation
}

function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}
```

#### Descriptive Names
```typescript
// Good: Descriptive and clear
const videoProcessingQueue = new Map<string, FFmpegOperation>();
const supportedVideoFormats = ['mp4', 'avi', 'mov', 'mkv'];

// Bad: Vague and unclear
const q = new Map();
const formats = ['mp4', 'avi', 'mov', 'mkv'];

// Good: Function names describe what they do
function validateVideoFile(file: File): boolean {
  // Implementation
}

function extractVideoMetadata(filePath: string): Promise<VideoInfo> {
  // Implementation
}

// Bad: Function names don't describe purpose
function check(file: File): boolean {
  // Implementation
}

function get(filePath: string): Promise<VideoInfo> {
  // Implementation
}
```

### 2. Constants

#### UPPER_SNAKE_CASE for Constants
```typescript
// Application constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const SUPPORTED_VIDEO_FORMATS = ['mp4', 'avi', 'mov', 'mkv'];
const DEFAULT_VIDEO_RESOLUTION = { width: 1920, height: 1080 };
const DEFAULT_FPS = 30;

// API endpoints
const API_BASE_URL = 'http://localhost:3001';
const VIDEO_UPLOAD_ENDPOINT = '/api/video/upload';
const AI_CHAT_ENDPOINT = '/api/ai/chat';

// Error codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR'
} as const;
```

### 3. Classes and Interfaces

#### PascalCase for Classes and Interfaces
```typescript
// Classes
class VideoProcessor {
  private ffmpegService: FFmpegService;
  private operationQueue: Map<string, FFmpegOperation>;

  constructor(ffmpegService: FFmpegService) {
    this.ffmpegService = ffmpegService;
    this.operationQueue = new Map();
  }

  async processVideo(operation: FFmpegOperation): Promise<string> {
    // Implementation
  }
}

// Interfaces
interface VideoProcessingService {
  processVideo(operation: FFmpegOperation): Promise<string>;
  getProgress(operationId: string): number;
  cancelOperation(operationId: string): boolean;
}

// Abstract classes
abstract class BaseVideoOperation {
  abstract execute(inputPath: string, outputPath: string): Promise<void>;

  protected validateParameters(parameters: any): boolean {
    // Common validation logic
    return true;
  }
}
```

## File and Directory Structure

### 1. File Naming

#### kebab-case for Files
```
src/
├── components/
│   ├── video-player.tsx
│   ├── timeline-track.tsx
│   └── ai-chat.tsx
├── services/
│   ├── video-service.ts
│   ├── ffmpeg-service.ts
│   └── ai-service.ts
├── stores/
│   ├── project-store.ts
│   └── ai-chat-store.ts
└── utils/
    ├── file-utils.ts
    ├── time-utils.ts
    └── validation-utils.ts
```

#### Descriptive File Names
```typescript
// Good: Clear and descriptive
video-processing-service.ts
timeline-clip-manager.ts
ai-command-parser.ts

// Bad: Vague and unclear
service.ts
manager.ts
parser.ts
```

### 2. Directory Organization

#### Feature-Based Organization
```
src/
├── features/
│   ├── video-editing/
│   │   ├── components/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   ├── ai-assistant/
│   │   ├── components/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   └── project-management/
│       ├── components/
│       ├── services/
│       ├── stores/
│       └── types/
├── shared/
│   ├── components/
│   ├── services/
│   ├── utils/
│   └── types/
└── app/
    ├── components/
    ├── stores/
    └── utils/
```

## Code Organization

### 1. Import Statements

#### Import Order
```typescript
// 1. External libraries (alphabetical)
import { create } from 'zustand';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// 2. Internal modules (alphabetical)
import { useAIChatStore } from '../stores/ai-chat-store';
import { useProjectStore } from '../stores/project-store';
import { VideoPlayer } from '../components/video-player';

// 3. Types and interfaces
import type { VideoClip, VideoProject } from '../types';

// 4. Constants
import { DEFAULT_VIDEO_RESOLUTION, SUPPORTED_FORMATS } from '../constants';
```

#### Import Aliases
```typescript
// Use aliases for long import paths
import { VideoProcessingService as VPS } from '../services/video-processing-service';

// Use aliases to avoid naming conflicts
import { Button as UIButton } from '../components/ui/button';
import { Button as FormButton } from '../components/form/button';

// Use aliases for better readability
import { FFmpegOperation as Operation } from '../types';
```

### 2. Export Statements

#### Named Exports
```typescript
// Prefer named exports over default exports
export { VideoPlayer } from './video-player';
export { Timeline } from './timeline';
export { AIChat } from './ai-chat';

// Export types and interfaces
export type { VideoClip, VideoProject, TimelineTrack };
export interface { VideoProcessingResult, AICommand };

// Export constants
export const SUPPORTED_VIDEO_FORMATS = ['mp4', 'avi', 'mov', 'mkv'];
export const DEFAULT_VIDEO_RESOLUTION = { width: 1920, height: 1080 };
```

#### Default Exports
```typescript
// Use default exports only for main components or entry points
// index.tsx
import App from './App';
export default App;

// App.tsx
const App: React.FC = () => {
  return (
    <div className="app">
      {/* App content */}
    </div>
  );
};

export default App;
```

### 3. Code Structure

#### Function Organization
```typescript
class VideoService {
  // 1. Private properties
  private ffmpegService: FFmpegService;
  private operationQueue: Map<string, FFmpegOperation>;

  // 2. Constructor
  constructor(ffmpegService: FFmpegService) {
    this.ffmpegService = ffmpegService;
    this.operationQueue = new Map();
  }

  // 3. Public methods
  async processVideo(operation: FFmpegOperation): Promise<string> {
    // Implementation
  }

  getProgress(operationId: string): number {
    // Implementation
  }

  // 4. Private methods
  private async executeOperation(operation: FFmpegOperation): Promise<void> {
    // Implementation
  }

  private validateOperation(operation: FFmpegOperation): boolean {
    // Implementation
  }
}
```

## Error Handling

### 1. Error Types

#### Custom Error Classes
```typescript
// Define custom error classes for different error types
class VideoProcessingError extends Error {
  constructor(
    message: string,
    public operationId: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'VideoProcessingError';
  }
}

class AIProcessingError extends Error {
  constructor(
    message: string,
    public command: string,
    public confidence: number
  ) {
    super(message);
    this.name = 'AIProcessingError';
  }
}

class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

#### Error Handling Patterns
```typescript
// Use try-catch blocks for async operations
async function processVideo(operation: FFmpegOperation): Promise<string> {
  try {
    // Validate operation
    if (!this.validateOperation(operation)) {
      throw new ValidationError('Invalid operation parameters', 'operation', operation);
    }

    // Execute operation
    const result = await this.ffmpegService.executeOperation(operation);
    return result;

  } catch (error) {
    // Log error for debugging
    console.error('Video processing error:', error);

    // Re-throw with context
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new VideoProcessingError(
      'Failed to process video',
      operation.id,
      error instanceof Error ? error : undefined
    );
  }
}

// Use Result pattern for operations that can fail
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function safeProcessVideo(operation: FFmpegOperation): Promise<Result<string, VideoProcessingError>> {
  try {
    const result = await this.processVideo(operation);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof VideoProcessingError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new VideoProcessingError('Unknown error occurred', operation.id)
    };
  }
}
```

### 2. Error Messages

#### User-Friendly Messages
```typescript
// Provide clear, actionable error messages
const ERROR_MESSAGES = {
  FILE_TOO_LARGE: (maxSize: string) =>
    `File size exceeds the maximum allowed size of ${maxSize}. Please choose a smaller file.`,

  UNSUPPORTED_FORMAT: (format: string, supported: string[]) =>
    `File format '${format}' is not supported. Supported formats: ${supported.join(', ')}.`,

  PROCESSING_FAILED: (operation: string) =>
    `Failed to ${operation}. Please try again or contact support if the problem persists.`,

  AI_SERVICE_UNAVAILABLE: () =>
    'AI service is currently unavailable. Please try again later or use manual editing options.'
} as const;

// Use error messages in error handling
function handleVideoUploadError(error: Error): string {
  if (error instanceof FileSizeError) {
    return ERROR_MESSAGES.FILE_TOO_LARGE(formatFileSize(MAX_FILE_SIZE));
  }

  if (error instanceof FormatError) {
    return ERROR_MESSAGES.UNSUPPORTED_FORMAT(error.format, SUPPORTED_VIDEO_FORMATS);
  }

  return ERROR_MESSAGES.PROCESSING_FAILED('upload video');
}
```

## Logging and Debugging

### 1. Logging Standards

#### Log Levels
```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: Error, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  }
}
```

#### Structured Logging
```typescript
// Use structured logging for better debugging
interface LogContext {
  operationId?: string;
  userId?: string;
  projectId?: string;
  duration?: number;
  [key: string]: any;
}

class StructuredLogger extends Logger {
  log(level: LogLevel, message: string, context: LogContext = {}): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context
    };

    switch (level) {
      case LogLevel.DEBUG:
        this.debug(JSON.stringify(logEntry));
        break;
      case LogLevel.INFO:
        this.info(JSON.stringify(logEntry));
        break;
      case LogLevel.WARN:
        this.warn(JSON.stringify(logEntry));
        break;
      case LogLevel.ERROR:
        this.error(JSON.stringify(logEntry));
        break;
    }
  }
}

// Usage
const logger = new StructuredLogger(LogLevel.DEBUG);

logger.log(LogLevel.INFO, 'Video processing started', {
  operationId: 'op123',
  projectId: 'proj456',
  inputFile: '/uploads/video.mp4'
});
```

### 2. Debugging Tools

#### Development Helpers
```typescript
// Use environment-based debugging
const isDevelopment = process.env.NODE_ENV === 'development';

// Debug logging in development
if (isDevelopment) {
  console.log('Debug info:', { operation, parameters });
}

// Performance measurement
function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  if (isDevelopment) {
    console.log(`${name} took ${duration.toFixed(2)}ms`);
  }

  return result;
}

// Async performance measurement
async function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (isDevelopment) {
    console.log(`${name} took ${duration.toFixed(2)}ms`);
  }

  return result;
}
```

## Performance Considerations

### 1. Memory Management

#### Efficient Data Structures
```typescript
// Use appropriate data structures for performance
class VideoProcessor {
  // Use Map for O(1) lookups
  private operationQueue = new Map<string, FFmpegOperation>();

  // Use Set for unique values
  private activeOperations = new Set<string>();

  // Use WeakMap for objects that might be garbage collected
  private operationMetadata = new WeakMap<FFmpegOperation, any>();

  // Use ArrayBuffer for large binary data
  private videoBuffer: ArrayBuffer | null = null;
}

// Avoid memory leaks
class VideoService {
  private listeners = new Map<string, Set<Function>>();

  addListener(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  removeListener(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      // Clean up empty event sets
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }
}
```

#### Lazy Loading
```typescript
// Implement lazy loading for heavy resources
class VideoService {
  private ffmpegService: FFmpegService | null = null;

  private async getFFmpegService(): Promise<FFmpegService> {
    if (!this.ffmpegService) {
      this.ffmpegService = await this.initializeFFmpegService();
    }
    return this.ffmpegService;
  }

  async processVideo(operation: FFmpegOperation): Promise<string> {
    const ffmpeg = await this.getFFmpegService();
    return ffmpeg.executeOperation(operation);
  }
}

// Use dynamic imports for code splitting
const loadVideoProcessor = async () => {
  const { VideoProcessor } = await import('./video-processor');
  return new VideoProcessor();
};
```

### 2. Async Operations

#### Promise Management
```typescript
// Use Promise.all for parallel operations
async function processMultipleVideos(operations: FFmpegOperation[]): Promise<string[]> {
  const promises = operations.map(op => this.processVideo(op));
  return Promise.all(promises);
}

// Use Promise.race for timeout handling
async function processVideoWithTimeout(
  operation: FFmpegOperation,
  timeoutMs: number
): Promise<string> {
  const processingPromise = this.processVideo(operation);
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
  });

  return Promise.race([processingPromise, timeoutPromise]);
}

// Use AbortController for cancellable operations
async function processVideoWithCancellation(
  operation: FFmpegOperation,
  signal: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => {
      reject(new Error('Operation cancelled'));
    });

    this.processVideo(operation)
      .then(resolve)
      .catch(reject);
  });
}
```

## Testing Conventions

### 1. Test Structure

#### Test Organization
```typescript
// Organize tests by feature and functionality
describe('VideoService', () => {
  let videoService: VideoService;
  let mockFFmpegService: jest.Mocked<FFmpegService>;

  beforeEach(() => {
    mockFFmpegService = createMockFFmpegService();
    videoService = new VideoService(mockFFmpegService);
  });

  describe('processVideo', () => {
    it('should process video successfully', async () => {
      // Arrange
      const operation = createMockOperation();
      mockFFmpegService.executeOperation.mockResolvedValue('/output/video.mp4');

      // Act
      const result = await videoService.processVideo(operation);

      // Assert
      expect(result).toBe('/output/video.mp4');
      expect(mockFFmpegService.executeOperation).toHaveBeenCalledWith(operation);
    });

    it('should throw error for invalid operation', async () => {
      // Arrange
      const invalidOperation = createInvalidOperation();

      // Act & Assert
      await expect(videoService.processVideo(invalidOperation))
        .rejects
        .toThrow('Invalid operation parameters');
    });
  });

  describe('getProgress', () => {
    it('should return operation progress', () => {
      // Arrange
      const operationId = 'op123';
      mockFFmpegService.getProgress.mockReturnValue(75);

      // Act
      const progress = videoService.getProgress(operationId);

      // Assert
      expect(progress).toBe(75);
      expect(mockFFmpegService.getProgress).toHaveBeenCalledWith(operationId);
    });
  });
});
```

#### Test Utilities
```typescript
// Create test utilities for common operations
export const createMockVideoClip = (overrides: Partial<VideoClip> = {}): VideoClip => ({
  id: 'clip123',
  name: 'test_video',
  path: '/test/video.mp4',
  startTime: 0,
  endTime: 120,
  duration: 120,
  thumbnail: '/test/thumbnail.jpg',
  ...overrides
});

export const createMockFFmpegOperation = (overrides: Partial<FFmpegOperation> = {}): FFmpegOperation => ({
  id: 'op123',
  type: 'trim',
  parameters: { startTime: 0, endTime: 30 },
  inputFile: '/test/input.mp4',
  outputFile: '/test/output.mp4',
  status: 'pending',
  ...overrides
});

export const createMockProject = (overrides: Partial<VideoProject> = {}): VideoProject => ({
  id: 'proj123',
  name: 'Test Project',
  tracks: [
    createMockTrack('video'),
    createMockTrack('audio')
  ],
  duration: 120,
  resolution: { width: 1920, height: 1080 },
  fps: 30,
  ...overrides
});
```

### 2. Mocking Strategies

#### Service Mocking
```typescript
// Create comprehensive mocks for external services
export const createMockFFmpegService = (): jest.Mocked<FFmpegService> => ({
  executeOperation: jest.fn(),
  getProgress: jest.fn(),
  getVideoInfo: jest.fn(),
  processVideo: jest.fn(),
  getAllOperations: jest.fn(),
  getOperation: jest.fn()
});

export const createMockAIService = (): jest.Mocked<AIService> => ({
  processMessage: jest.fn(),
  getStatus: jest.fn(),
  getAvailableCommands: jest.fn(),
  generateOperation: jest.fn()
});

// Use mock implementations for complex scenarios
export const createMockFFmpegServiceWithBehavior = (behavior: {
  shouldSucceed?: boolean;
  shouldTimeout?: boolean;
  customError?: Error;
} = {}) => {
  const mock = createMockFFmpegService();

  mock.executeOperation.mockImplementation(async (operation) => {
    if (behavior.shouldTimeout) {
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    if (behavior.customError) {
      throw behavior.customError;
    }

    if (behavior.shouldSucceed === false) {
      throw new Error('Mock failure');
    }

    return `/output/${operation.id}.mp4`;
  });

  return mock;
};
```

## Documentation Standards

### 1. Code Comments

#### Function Documentation
```typescript
/**
 * Processes a video file using FFmpeg operations
 *
 * @param operation - The FFmpeg operation to execute
 * @param inputPath - Optional input path override
 * @returns Promise that resolves to the output file path
 *
 * @example
 * ```typescript
 * const operation = createTrimOperation(0, 30);
 * const outputPath = await videoService.processVideo(operation);
 * console.log('Video processed:', outputPath);
 * ```
 *
 * @throws {VideoProcessingError} When video processing fails
 * @throws {ValidationError} When operation parameters are invalid
 */
async processVideo(
  operation: FFmpegOperation,
  inputPath?: string
): Promise<string> {
  // Implementation
}
```

#### Interface Documentation
```typescript
/**
 * Represents a video editing operation that can be executed by FFmpeg
 *
 * @interface FFmpegOperation
 * @description This interface defines the structure for all video processing operations
 * including trim, cut, resize, overlay, and audio adjustments.
 */
interface FFmpegOperation {
  /** Unique identifier for the operation */
  id: string;

  /** Type of video processing operation */
  type: 'trim' | 'cut' | 'resize' | 'overlay' | 'audio';

  /** Operation-specific parameters */
  parameters: Record<string, any>;

  /** Input video file path */
  inputFile: string;

  /** Output video file path */
  outputFile: string;

  /** Current status of the operation */
  status: 'pending' | 'processing' | 'completed' | 'error';

  /** Processing progress (0-100) */
  progress?: number;
}
```

### 2. README Documentation

#### Project README
```markdown
# AI Video Editor

A desktop video editing application powered by AI, allowing users to edit videos using natural language commands.

## Features

- **AI-Powered Editing**: Edit videos using natural language
- **Real-time Preview**: See changes immediately in the timeline
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Local Processing**: All video processing happens on your machine

## Quick Start

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Start Development**
   ```bash
   pnpm dev
   ```

3. **Build Application**
   ```bash
   pnpm build
   ```

## Architecture

The application consists of three main components:

- **Frontend**: Electron app with React UI
- **Backend**: Node.js API server with FFmpeg integration
- **AI Service**: Ollama-powered natural language processing

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and [docs/](./docs/) for detailed documentation.
```

#### API Documentation
```markdown
# API Reference

## Authentication

All API endpoints require authentication via API key in the `Authorization` header:

```
Authorization: Bearer <your-api-key>
```

## Endpoints

### Video Processing

#### POST /api/video/upload

Upload a video file for processing.

**Request**
- Content-Type: `multipart/form-data`
- Body: `video` file

**Response**
```json
{
  "success": true,
  "clip": {
    "id": "clip123",
    "name": "video.mp4",
    "path": "/uploads/video.mp4",
    "duration": 120
  }
}
```

**Error Codes**
- `FILE_TOO_LARGE`: File exceeds maximum size limit
- `INVALID_FORMAT`: Unsupported video format
- `UPLOAD_FAILED`: File upload failed

## Rate Limiting

- General endpoints: 100 requests per 15 minutes
- AI endpoints: 20 requests per 15 minutes
- Video processing: 10 requests per 15 minutes
```

## Git Conventions

### 1. Commit Messages

#### Conventional Commits
```bash
# Format: <type>(<scope>): <description>

# Feature commits
feat(video): add trim operation support
feat(ai): implement natural language command parsing
feat(ui): add timeline zoom controls

# Bug fix commits
fix(backend): resolve memory leak in video processing
fix(frontend): fix timeline clip dragging issue
fix(ai): handle malformed AI responses gracefully

# Documentation commits
docs(api): add comprehensive endpoint documentation
docs(setup): update installation instructions
docs(conventions): add coding standards guide

# Refactor commits
refactor(services): extract common video processing logic
refactor(types): consolidate video-related interfaces
refactor(utils): improve error handling utilities

# Test commits
test(services): add comprehensive video service tests
test(api): add integration tests for video endpoints
test(ui): add component testing for timeline
```

#### Commit Message Guidelines
- Use present tense ("add" not "added")
- Use imperative mood ("move" not "moves")
- Limit first line to 72 characters
- Separate subject from body with blank line
- Use body to explain what and why, not how

### 2. Branch Naming

#### Branch Structure
```bash
# Feature branches
feature/video-trimming
feature/ai-command-parsing
feature/timeline-zoom

# Bug fix branches
bugfix/memory-leak-video-processing
bugfix/timeline-drag-issue
bugfix/ai-response-parsing

# Hotfix branches
hotfix/critical-security-vulnerability
hotfix/crash-on-video-import
hotfix/ai-service-timeout

# Release branches
release/v1.0.0
release/v1.1.0
release/v2.0.0
```

### 3. Pull Request Guidelines

#### PR Template
```markdown
## Description

Brief description of changes and why they're needed.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Performance impact assessed

## Checklist

- [ ] Code follows project conventions
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No console.log statements left in code
- [ ] Error handling implemented
- [ ] Security considerations addressed
```

## Security Guidelines

### 1. Input Validation

#### File Upload Security
```typescript
// Validate file types and sizes
function validateVideoFile(file: File): boolean {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }

  // Check file type
  const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  // Check file extension
  const extension = path.extname(file.name).toLowerCase();
  const allowedExtensions = ['.mp4', '.avi', '.mov', '.mkv'];
  if (!allowedExtensions.includes(extension)) {
    throw new Error('Invalid file extension');
  }

  return true;
}

// Sanitize file paths
function sanitizeFilePath(filePath: string): string {
  const normalized = path.normalize(filePath);
  const resolved = path.resolve(normalized);

  // Ensure path is within allowed directory
  const uploadsDir = path.resolve('uploads');
  if (!resolved.startsWith(uploadsDir)) {
    throw new Error('Invalid file path');
  }

  return resolved;
}
```

#### API Security
```typescript
// Rate limiting
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});

// Input sanitization
import { body, validationResult } from 'express-validator';

const validateProjectCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Project name contains invalid characters'),

  body('resolution.width')
    .isInt({ min: 1, max: 7680 })
    .withMessage('Width must be between 1 and 7680'),

  body('resolution.height')
    .isInt({ min: 1, max: 4320 })
    .withMessage('Height must be between 1 and 4320'),

  body('fps')
    .isInt({ min: 1, max: 120 })
    .withMessage('FPS must be between 1 and 120')
];
```

### 2. Error Handling Security

#### Secure Error Messages
```typescript
// Don't expose internal system details
class SecureErrorHandler {
  static handleError(error: Error, req: Request, res: Response): void {
    // Log full error for debugging
    console.error('Full error:', error);

    // Determine user-friendly message
    let userMessage: string;
    let statusCode: number;

    if (error instanceof ValidationError) {
      userMessage = 'Invalid input provided';
      statusCode = 400;
    } else if (error instanceof FileNotFoundError) {
      userMessage = 'File not found';
      statusCode = 404;
    } else if (error instanceof ProcessingError) {
      userMessage = 'Video processing failed';
      statusCode = 500;
    } else {
      userMessage = 'An unexpected error occurred';
      statusCode = 500;
    }

    // Send sanitized response
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      requestId: req.id // For tracking in logs
    });
  }
}
```

## Performance Guidelines

### 1. Video Processing Optimization

#### Efficient FFmpeg Operations
```typescript
// Batch operations when possible
async function processVideoBatch(operations: FFmpegOperation[]): Promise<string> {
  // Group operations by type for efficiency
  const groupedOperations = groupOperationsByType(operations);

  // Process each group
  let currentInput = this.inputPath;
  for (const [type, ops] of Object.entries(groupedOperations)) {
    currentInput = await this.processOperationGroup(type, ops, currentInput);
  }

  return currentInput;
}

// Use appropriate FFmpeg presets
function getFFmpegPreset(quality: 'fast' | 'medium' | 'slow'): string {
  switch (quality) {
    case 'fast':
      return 'ultrafast'; // Fastest encoding, lower quality
    case 'medium':
      return 'medium'; // Balanced speed and quality
    case 'slow':
      return 'slow'; // Slowest encoding, highest quality
    default:
      return 'medium';
  }
}
```

### 2. Memory Management

#### Efficient Data Handling
```typescript
// Use streams for large files
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

async function processLargeVideo(inputPath: string, outputPath: string): Promise<void> {
  const inputStream = createReadStream(inputPath);
  const outputStream = createWriteStream(outputPath);

  // Process video in chunks without loading entire file into memory
  await pipeline(inputStream, outputStream);
}

// Clean up resources
class VideoProcessor {
  private activeOperations = new Set<string>();

  async cleanup(): Promise<void> {
    // Cancel active operations
    for (const operationId of this.activeOperations) {
      await this.cancelOperation(operationId);
    }

    // Clear operation tracking
    this.activeOperations.clear();

    // Clean up temporary files
    await this.cleanupTempFiles();
  }

  private async cleanupTempFiles(): Promise<void> {
    const tempDir = path.join(process.cwd(), 'temp');
    if (fs.existsSync(tempDir)) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}
```

## Future Considerations

### 1. Scalability

#### Microservices Architecture
```typescript
// Plan for future service decomposition
interface VideoProcessingService {
  processVideo(operation: FFmpegOperation): Promise<string>;
  getProgress(operationId: string): number;
  cancelOperation(operationId: string): boolean;
}

interface AIService {
  processMessage(message: string, context: any): Promise<AICommand>;
  getStatus(): Promise<AIStatus>;
}

interface ProjectService {
  createProject(data: CreateProjectData): Promise<VideoProject>;
  getProject(id: string): Promise<VideoProject>;
  updateProject(id: string, data: UpdateProjectData): Promise<VideoProject>;
}
```

### 2. Monitoring and Observability

#### Performance Metrics
```typescript
// Implement metrics collection
interface MetricsCollector {
  recordOperation(operation: FFmpegOperation, duration: number): void;
  recordError(error: Error, context: any): void;
  recordUserAction(action: string, metadata: any): void;
}

// Use for performance monitoring
class PerformanceMonitor {
  private metrics: MetricsCollector;

  async measureOperation<T>(
    operation: FFmpegOperation,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - start;

      this.metrics.recordOperation(operation, duration);
      return result;
    } catch (error) {
      this.metrics.recordError(error, { operation });
      throw error;
    }
  }
}
```

### 3. Testing Evolution

#### Advanced Testing Strategies
```typescript
// Property-based testing for complex operations
import { property, forAll } from 'fast-check';

describe('Video Processing Properties', () => {
  it('should maintain video duration consistency', () => {
    property(
      forAll(arbitraryVideoOperation(), arbitraryVideoFile()),
      (operation, videoFile) => {
        // Test that video processing maintains duration properties
        const result = processVideo(operation, videoFile);
        expect(result.duration).toBeGreaterThan(0);
        expect(result.duration).toBeLessThanOrEqual(videoFile.duration);
      }
    );
  });
});

// Contract testing for service interactions
describe('Service Contracts', () => {
  it('should fulfill AI service contract', async () => {
    const aiService = new AIService();
    const contract = new AIServiceContract();

    const isValid = await contract.validate(aiService);
    expect(isValid).toBe(true);
  });
});
```

## Conclusion

Following these coding conventions ensures that the AI Video Editor project maintains high code quality, consistency, and maintainability. These guidelines should be treated as living documents that evolve with the project and team needs.

Remember that conventions are tools to help us write better code, not rigid rules that should be followed blindly. When in doubt, prioritize code clarity and maintainability over strict adherence to conventions.
