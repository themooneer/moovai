import axios from 'axios';

// Base API configuration
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000,
});

export { api };

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any request headers or authentication here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Video API methods
export const videoAPI = {
  upload: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/video/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress ? (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      } : undefined,
    });
  },

  getInfo: (videoId: string) => {
    // URL-encode the videoId to handle file paths with forward slashes
    const encodedId = encodeURIComponent(videoId);
    return api.get(`/video/info/${encodedId}`);
  },

  process: (inputPath: string, outputPath: string, operations: any[]) => {
    return api.post('/video/process', {
      inputPath,
      outputPath,
      operations,
    });
  },

  getProgress: (operationId: string) => {
    return api.get(`/video/progress/${operationId}`);
  },
};

// AI API methods
export const aiAPI = {
  chat: (message: string, projectContext?: any) => {
    return api.post('/ai/chat', {
      message,
      projectContext,
    });
  },

  getStatus: () => {
    return api.get('/ai/status');
  },

  getCommands: () => {
    return api.get('/ai/commands');
  },

  execute: (command: string, parameters: any) => {
    return api.post('/ai/execute', {
      command,
      parameters,
    });
  },
};

// Project API methods
export const projectAPI = {
  create: (name: string, resolution?: { width: number; height: number }, fps?: number) => {
    return api.post('/project', { name, resolution, fps });
  },

  get: (projectId: string) => {
    return api.get(`/project/${projectId}`);
  },

  update: (projectId: string, updates: any) => {
    return api.put(`/project/${projectId}`, updates);
  },

  delete: (projectId: string) => {
    return api.delete(`/project/${projectId}`);
  },

  addTrack: (projectId: string, name: string, type: 'video' | 'audio' | 'overlay') => {
    return api.post(`/project/${projectId}/tracks`, { name, type });
  },

  removeTrack: (projectId: string, trackId: string) => {
    return api.delete(`/project/${projectId}/tracks/${trackId}`);
  },

  export: (projectId: string, outputPath: string, format: string = 'mp4') => {
    return api.post(`/project/${projectId}/export`, { outputPath, format });
  },
};
