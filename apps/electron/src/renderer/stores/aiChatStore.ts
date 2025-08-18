import { create } from 'zustand';
import { ChatMessage, AICommand } from '../types';
import { api } from '../services/api';

interface AIChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  aiStatus: 'idle' | 'processing' | 'ready' | 'error';

  // Actions
  sendMessage: (content: string, projectContext?: any) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  getAIStatus: () => Promise<void>;
  clearError: () => void;
}

export const useAIChatStore = create<AIChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  aiStatus: 'idle',

  sendMessage: async (content: string, projectContext?: any) => {
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      content,
      timestamp: new Date(),
      status: 'pending'
    };

    // Add user message immediately
    set(state => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null
    }));

    try {
      // Send to AI service
      const response = await api.post('/api/ai/chat', {
        message: content,
        projectContext
      });

      const aiResponse = response.data.aiResponse;

      // Add AI response message
      const aiMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'assistant',
        content: `I'll help you with that! ${aiResponse.command ? 'Processing your request...' : 'How can I help you further?'}`,
        timestamp: new Date(),
        status: 'completed',
        ffmpegCommand: aiResponse.operation ? JSON.stringify(aiResponse.operation) : undefined
      };

      set(state => ({
        messages: [...state.messages, aiMessage],
        isLoading: false
      }));

      // If AI generated a command, update the user message status
      if (aiResponse.command) {
        set(state => ({
          messages: state.messages.map(msg =>
            msg.id === userMessage.id
              ? { ...msg, status: 'completed' as const }
              : msg
          )
        }));
      }

    } catch (error) {
      // Update user message status to error
      set(state => ({
        messages: state.messages.map(msg =>
          msg.id === userMessage.id
            ? { ...msg, status: 'error' as const }
            : msg
        ),
        error: error instanceof Error ? error.message : 'Failed to send message',
        isLoading: false
      }));
    }
  },

  addMessage: (message: ChatMessage) => {
    set(state => ({
      messages: [...state.messages, message]
    }));
  },

  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => {
    set(state => ({
      messages: state.messages.map(msg =>
        msg.id === messageId
          ? { ...msg, ...updates }
          : msg
      )
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  getAIStatus: async () => {
    try {
      const response = await api.get('/api/ai/status');
      const status = response.data;

      set({
        aiStatus: status.available ? 'ready' : 'error',
        error: status.available ? null : 'AI service not available'
      });
    } catch (error) {
      set({
        aiStatus: 'error',
        error: 'Failed to get AI status'
      });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
