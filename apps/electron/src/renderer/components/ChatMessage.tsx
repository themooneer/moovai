import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        );
      case 'processing':
        return (
          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        );
      case 'completed':
        return (
          <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getMessageStyle = () => {
    if (message.type === 'user') {
      return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white ml-12 shadow-lg shadow-blue-500/25';
    } else {
      return 'bg-white/10 backdrop-blur-sm text-gray-100 mr-12 border border-white/10 shadow-lg';
    }
  };

  const getAvatar = () => {
    if (message.type === 'user') {
      return (
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-semibold text-sm shadow-lg">
          U
        </div>
      );
    } else {
      return (
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
  };

  return (
    <div className={`chat-message flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
      {message.type === 'assistant' && (
        <div className="flex-shrink-0 mr-3">
          {getAvatar()}
        </div>
      )}

      <div className="flex flex-col max-w-xs lg:max-w-md">
        <div className={`message-bubble rounded-2xl px-4 py-3 ${getMessageStyle()}`}>
          <div className="flex items-start space-x-3">
            <div className="flex-1">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

              {/* FFmpeg Command Display */}
              {message.ffmpegCommand && (
                <div className="mt-3 p-3 bg-black/20 backdrop-blur-sm rounded-xl text-xs font-mono text-gray-300 overflow-x-auto border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 font-medium">FFmpeg Operation:</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(message.ffmpegCommand!)}
                      className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-white/10 transition-colors duration-200"
                      title="Copy command"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    </button>
                  </div>
                  <code className="text-xs bg-black/30 p-2 rounded-lg block">{message.ffmpegCommand}</code>
                </div>
              )}
            </div>

            {/* Status Indicator */}
            <div className="flex-shrink-0 ml-2">
              {getStatusIcon(message.status)}
            </div>
          </div>
        </div>

        {/* Message Metadata */}
        <div className={`text-xs text-gray-400 mt-2 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
          {message.status === 'error' && (
            <span className="ml-2 text-red-400 font-medium">Failed to process</span>
          )}
        </div>
      </div>

      {message.type === 'user' && (
        <div className="flex-shrink-0 ml-3">
          {getAvatar()}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
