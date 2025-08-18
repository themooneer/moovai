// Local type definitions to avoid import issues with @ai-video-editor/shared

// Global type definitions for Electron API
declare global {
  interface Window {
    electronAPI: {
      // File dialogs
      openFile: () => Promise<string | null>;
      saveFile: () => Promise<string | null>;
      openDirectory: () => Promise<string | null>;

      // App info
      getVersion: () => Promise<string>;
      getPath: (name: string) => Promise<string>;

      // Window management
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      toggleDevTools: () => Promise<void>;
      reload: () => Promise<void>;

      // IPC communication
      on: (channel: string, callback: Function) => void;
      once: (channel: string, callback: Function) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

export interface VideoClip {
  id: string;
  name: string;
  path: string;
  startTime: number;
  endTime: number;
  duration: number;
  thumbnail?: string;
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

export interface AICommand {
  command: string;
  operation: any;
  confidence: number;
}

export interface FFmpegOperation {
  id: string;
  type: 'trim' | 'cut' | 'resize' | 'overlay' | 'audio';
  parameters: Record<string, any>;
  inputFile: string;
  outputFile: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
}
