import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { videoRoutes } from './routes/video';
import { aiRoutes } from './routes/ai';
import { projectRoutes } from './routes/project';
import { setupWebSocket } from './websocket';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Routes
app.use('/api/video', videoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/project', projectRoutes);

// WebSocket setup
setupWebSocket(wss);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time updates`);
});

export { app, server };
