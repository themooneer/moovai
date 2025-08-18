import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { promises as fs } from 'fs';
import path from 'path';
import { videoRoutes } from './routes/video';
import { aiRoutes } from './routes/ai';
import { projectRoutes } from './routes/project';
import { setupWebSocket } from './websocket';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server }) as any; // Cast to any for now to avoid type issues

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
  }
};

// Initialize uploads directory
ensureUploadsDir();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    // Set proper headers for video files
    if (path.endsWith('.mp4') || path.endsWith('.avi') || path.endsWith('.mov') ||
        path.endsWith('.mkv') || path.endsWith('.wmv') || path.endsWith('.flv') ||
        path.endsWith('.webm') || path.endsWith('.m4v') || path.endsWith('.3gp') ||
        path.endsWith('.ogv')) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', 'video/mp4'); // Default to mp4 for streaming
    }
  }
}));

// Routes
app.use('/api/video', videoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/project', projectRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check if FFmpeg is available
    const { execSync } = require('child_process');
    execSync('ffmpeg -version', { stdio: 'ignore' });
    execSync('ffprobe -version', { stdio: 'ignore' });

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      ffmpeg: 'available',
      uploadsDir: path.join(process.cwd(), 'uploads'),
      projectsDir: path.join(process.cwd(), 'projects')
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      ffmpeg: 'unavailable',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// WebSocket setup
setupWebSocket(wss);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time updates`);
  console.log(`📁 Uploads directory: ${path.join(process.cwd(), 'uploads')}`);
});

export { app, server };
