import axios from 'axios';

// Create axios instance with default configuration
export const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/api/video/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getInfo: (videoId: string) => {
    return api.get(`/api/video/info/${videoId}`);
  },

  process: (inputPath: string, outputPath: string, operations: any[]) => {
    return api.post('/api/video/process', {
      inputPath,
      outputPath,
      operations,
    });
  },

  getProgress: (operationId: string) => {
    return api.get(`/api/video/progress/${operationId}`);
  },
};

// AI API methods
export const aiAPI = {
  chat: (message: string, projectContext?: any) => {
    return api.post('/api/ai/chat', {
      message,
      projectContext,
    });
  },

  getStatus: () => {
    return api.get('/api/ai/status');
  },

  getCommands: () => {
    return api.get('/api/ai/commands');
  },

  execute: (command: string, parameters: any) => {
    return api.post('/api/ai/execute', {
      command,
      parameters,
    });
  },
};

// Project API methods
export const projectAPI = {
  create: (name: string, resolution?: { width: number; height: number }, fps?: number) => {
    return api.post('/api/project', { name, resolution, fps });
  },

  get: (projectId: string) => {
    return api.get(`/api/project/${projectId}`);
  },

  update: (projectId: string, updates: any) => {
    return api.put(`/api/project/${projectId}`, updates);
  },

  delete: (projectId: string) => {
    return api.delete(`/api/project/${projectId}`);
  },

  addTrack: (projectId: string, name: string, type: 'video' | 'audio' | 'overlay') => {
    return api.post(`/api/project/${projectId}/tracks`, { name, type });
  },

  removeTrack: (projectId: string, trackId: string) => {
    return api.delete(`/api/project/${projectId}/tracks/${trackId}`);
  },

  export: (projectId: string, outputPath: string, format: string = 'mp4') => {
    return api.post(`/api/project/${projectId}/export`, { outputPath, format });
  },
};

export default api;
