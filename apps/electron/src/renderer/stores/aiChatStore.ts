import { create } from 'zustand';
import { ChatMessage } from '../types';
import { api } from '../services/api';

interface AIChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  processingVideo: boolean;
  lastProcessedVideo?: {
    url: string;
    timestampKey: string;
    operation: any;
  };

  // Actions
  sendMessage: (content: string, projectContext?: any) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setProcessingVideo: (processing: boolean) => void;
  cleanupProcessedVideo: () => void; // Clean up blob URLs to free memory
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

                // Handle the new processed video buffer
        if (aiResponse.ffmpegResult.timestampKey) {
          if (aiResponse.ffmpegResult.buffer) {
            try {
              // Clean up previous processed video to free memory
              const currentState = get();
              if (currentState.lastProcessedVideo?.url) {
                try {
                  URL.revokeObjectURL(currentState.lastProcessedVideo.url);
                  console.log('🧹 Cleaned up previous processed video blob URL');
                } catch (cleanupError) {
                  console.warn('⚠️ Failed to cleanup previous blob URL:', cleanupError);
                }
              }

              // Convert buffer to blob URL for the video player
              const videoBlob = new Blob([Uint8Array.from(atob(aiResponse.ffmpegResult.buffer), c => c.charCodeAt(0))], { type: 'video/mp4' });
              const newVideoUrl = URL.createObjectURL(videoBlob);

              console.log(`🎬 New processed video created with timestamp key: ${aiResponse.ffmpegResult.timestampKey}`);
              console.log(`🎬 New video blob URL: ${newVideoUrl}`);

              // Store the new video URL in the store for the video player to use
              set(state => ({
                lastProcessedVideo: {
                  url: newVideoUrl,
                  timestampKey: aiResponse.ffmpegResult.timestampKey,
                  operation: aiResponse.operation
                }
              }));
            } catch (bufferError) {
              console.error('❌ Failed to process video buffer:', bufferError);
            }
          } else if (aiResponse.ffmpegResult.largeFile) {
            // For large files, store the path instead of buffer
            console.log(`🎬 Large processed video detected, using path: ${aiResponse.ffmpegResult.path}`);
            set(state => ({
              lastProcessedVideo: {
                url: aiResponse.ffmpegResult.path,
                timestampKey: aiResponse.ffmpegResult.timestampKey,
                operation: aiResponse.operation,
                isLargeFile: true
              }
            }));
          }
        }

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
  },

  cleanupProcessedVideo: () => {
    set(state => {
      // Clean up the previous blob URL to free memory
      if (state.lastProcessedVideo?.url) {
        try {
          URL.revokeObjectURL(state.lastProcessedVideo.url);
          console.log('🧹 Cleaned up processed video blob URL to free memory');
        } catch (error) {
          console.warn('⚠️ Failed to cleanup blob URL:', error);
        }
      }

      return {
        ...state,
        lastProcessedVideo: undefined
      };
    });
  }
}));
