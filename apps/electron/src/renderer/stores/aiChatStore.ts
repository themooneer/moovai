import { create } from 'zustand';
import { ChatMessage } from '../types';
import { api } from '../services/api';

interface AIChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  processingVideo: boolean;

  // Actions
  sendMessage: (content: string, projectContext?: any) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setProcessingVideo: (processing: boolean) => void;
}

export const useAIChatStore = create<AIChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  processingVideo: false,

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
      error: null,
      processingVideo: true // Start video processing
    }));

    try {
      // Send to AI service
      const response = await api.post('/ai/chat', {
        message: content,
        projectContext
      });

      const aiResponse = response.data.aiResponse;

      // If AI processed a video and we have a result
      if (aiResponse.ffmpegResult && aiResponse.operation) {
        console.log('🎬 AI processed video result received:', aiResponse);

        // Add AI response message
        const aiMessage: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'assistant',
          content: `✅ Video processed successfully! The updated video is now available in the player.`,
          timestamp: new Date(),
          status: 'completed',
          ffmpegCommand: JSON.stringify(aiResponse.operation)
        };

        set(state => ({
          messages: [...state.messages, aiMessage],
          isLoading: false,
          processingVideo: false
        }));

        console.log('🎬 AI message updated, video processing completed');
        return;
      }

      // Add AI response message for non-video operations
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
        isLoading: false,
        processingVideo: false
      }));

      // Update user message status
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
        isLoading: false,
        processingVideo: false
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

  setProcessingVideo: (processing: boolean) => {
    set({ processingVideo: processing });
  }
}));
