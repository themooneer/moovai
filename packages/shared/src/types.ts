export interface VideoClip {
  id: string;
  name: string;
  path: string;
  startTime: number;
  endTime: number;
  duration: number;
  thumbnail?: string;
  timestampKey?: string; // Unique timestamp key for tracking video versions
  buffer?: string; // Base64 encoded video buffer
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'overlay';
  clips: VideoClip[];
  enabled: boolean;
}

export interface VideoProject {
  id: string;
  name: string;
  tracks: TimelineTrack[];
  duration: number;
  resolution: {
    width: number;
    height: number;
  };
  fps: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  ffmpegCommand?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface FFmpegOperation {
  id: string;
  type: 'trim' | 'cut' | 'resize' | 'overlay' | 'audio' | 'thumbnail';
  parameters: Record<string, any>;
  inputFile: string;
  outputFile: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
}

export interface AICommand {
  command: string;
  operation: FFmpegOperation;
  confidence: number;
  ffmpegResult?: AIProcessingResult; // Result from AI processing
}

export interface VideoProcessingResult {
  success: boolean;
  outputPath: string;
  duration: number;
  error?: string;
}

export interface AIProcessingResult {
  timestampKey: string;
  buffer: string; // Base64 encoded processed video
  path: string; // File path of processed video
}
