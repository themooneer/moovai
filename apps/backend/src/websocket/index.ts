import { WebSocketServer, WebSocket } from 'ws';
import { ChatMessage, FFmpegOperation } from '@ai-video-editor/shared';

interface Client {
  ws: WebSocket;
  id: string;
  projectId?: string;
}

// Extend WebSocketServer interface
interface ExtendedWebSocketServer extends WebSocketServer {
  broadcast: (message: any) => void;
  broadcastToProject: (projectId: string, message: any) => void;
  sendToClient: (clientId: string, message: any) => void;
}

export function setupWebSocket(wss: ExtendedWebSocketServer): void {
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

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      clients.delete(clientId);
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

  // Send message to specific client
  wss.sendToClient = (clientId: string, message: any) => {
    const client = clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  };
}

function handleWebSocketMessage(client: Client, message: any, clients: Map<string, Client>): void {
  switch (message.type) {
    case 'join_project':
      client.projectId = message.projectId;
      client.ws.send(JSON.stringify({
        type: 'project_joined',
        projectId: message.projectId
      }));
      break;

    case 'chat_message':
      // Broadcast chat message to project members
      if (client.projectId) {
        const chatMessage: ChatMessage = {
          id: message.id,
          type: 'user',
          content: message.content,
          timestamp: new Date(),
          status: 'pending'
        };

        // Broadcast to project members
        const wss = client.ws as any;
        if (wss.broadcastToProject) {
          wss.broadcastToProject(client.projectId, {
            type: 'chat_message',
            message: chatMessage
          });
        }
      }
      break;

    case 'ffmpeg_progress':
      // Broadcast FFmpeg operation progress
      if (client.projectId) {
        const wss = client.ws as any;
        if (wss.broadcastToProject) {
          wss.broadcastToProject(client.projectId, {
            type: 'ffmpeg_progress',
            operationId: message.operationId,
            progress: message.progress
          });
        }
      }
      break;

    case 'timeline_update':
      // Broadcast timeline updates
      if (client.projectId) {
        const wss = client.ws as any;
        if (wss.broadcastToProject) {
          wss.broadcastToProject(client.projectId, {
            type: 'timeline_update',
            projectId: client.projectId,
            tracks: message.tracks
          });
        }
      }
      break;

    default:
      client.ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type'
      }));
  }
}

function generateClientId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Export WebSocket server instance for use in other services
export function getWebSocketServer(): WebSocketServer | null {
  // This would need to be implemented to get the actual WSS instance
  // For now, return null
  return null;
}
