import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import ChatMessageComponent from './ChatMessage';
import CommandSuggestions from './CommandSuggestions';

interface AIChatProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
}

const AIChat: React.FC<AIChatProps> = ({ messages, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onSendMessage(inputValue);
      setInputValue('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCommandSelect = (command: string) => {
    setInputValue(command);
    inputRef.current?.focus();
  };

  return (
    <div className="ai-chat h-full flex flex-col bg-transparent">
      {/* Chat Header */}
      <div className="chat-header bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-6 py-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse shadow-lg"></div>
          <div>
            <h3 className="text-white font-semibold text-lg">AI Command Panel</h3>
            <p className="text-gray-300 text-sm">
              Describe what you want to do with your video
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chat-messages flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 text-purple-400/60">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="text-gray-200 font-semibold text-lg mb-3">Welcome to AI Video Editor!</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              Start by describing what you want to do with your video.<br />
              Try commands like "Add cinematic color grading" or "Trim to 30 seconds"
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))
        )}

        {isLoading && (
          <div className="flex items-center space-x-3 text-gray-400 bg-white/5 rounded-2xl p-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm font-medium">AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Command Suggestions */}
      <div className="command-suggestions border-t border-white/10 p-6 bg-black/10">
        <CommandSuggestions onCommandSelect={handleCommandSelect} />
      </div>

      {/* Chat Input */}
      <div className="chat-input border-t border-white/10 p-6 bg-black/10">
        <div className="flex space-x-3">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to do with your video..."
            className="flex-1 bg-white/5 text-white placeholder-gray-400 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all duration-200 border border-white/10"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Send</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500 text-center">
          Press <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">Enter</kbd> to send, <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">Shift+Enter</kbd> for new line
        </div>
      </div>
    </div>
  );
};

export default AIChat;
