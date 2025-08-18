import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import ChatMessageComponent from './ChatMessage';
import CommandSuggestions from './CommandSuggestions';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface AIChatProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
}

const AIChat: React.FC<AIChatProps> = ({ messages, onSendMessage, expanded, onToggle }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickCommandsExpanded, setIsQuickCommandsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const quickCommands = [
    { icon: '✂️', label: 'Trim', command: 'Trim the video to 30 seconds' },
    { icon: '🎨', label: 'Filters', command: 'Apply cinematic color grading' },
    { icon: '🔊', label: 'Audio', command: 'Add background music' },
    { icon: '📐', label: 'Resize', command: 'Resize to 1080p' },
    { icon: '🎬', label: 'Transitions', command: 'Add smooth transitions between clips' },
    { icon: '🎭', label: 'Effects', command: 'Apply special effects and overlays' },
    { icon: '🎵', label: 'Music', command: 'Add background music with fade in/out' },
    { icon: '📊', label: 'Speed', command: 'Change video playback speed' }
  ];

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
      {/* Chat Header with Expand/Collapse */}
      <div className="chat-header bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse shadow-lg"></div>
            <div>
              <h3 className="text-white font-semibold text-lg">AI Command Panel</h3>
              <p className="text-gray-300 text-sm">
                Describe what you want to do with your video
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const newExpanded = !expanded;
              onToggle(newExpanded);
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 text-gray-300 hover:text-white"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronDown size={20} />
            ) : (
              <ChevronUp size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      <div className={`transition-all duration-300 ease-out overflow-hidden ${
        expanded ? 'max-h-[calc(100vh-200px)] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        {/* Chat Messages - Takes most of the space */}
        <div className="chat-messages flex-1 p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 text-purple-400/40">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">
                Start by describing what you want to do with your video
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

        {/* Chat Input + Helpers - First section */}
        <div className="chat-input border-t border-white/10 p-6 bg-black/10">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to do with your video..."
              className="w-full bg-white/5 text-white placeholder-gray-400 rounded-2xl px-4 py-3 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all duration-200 border border-white/10"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-500 text-center">
            Press <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">Enter</kbd> to send, <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">Shift+Enter</kbd> for new line
          </div>
        </div>

        {/* Pro Tips - Second section */}
        <div className="pro-tips border-t border-white/10 p-6 bg-black/5">
          <h4 className="text-white font-semibold text-sm mb-3 flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            Pro Tips
          </h4>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Be specific: "Trim from 0:30 to 1:15" instead of "trim the video"</p>
            <p>• Use natural language: "Add a cinematic look with warm colors"</p>
            <p>• Combine commands: "Add background music and fade out at the end"</p>
          </div>
        </div>

        {/* Expandable Quick Commands - Third section */}
        <div className="quick-commands border-t border-white/10 bg-black/10">
          <button
            onClick={() => setIsQuickCommandsExpanded(!isQuickCommandsExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <span className="text-white font-medium text-sm">Quick Commands</span>
              <span className="text-gray-400 text-xs">({quickCommands.length} available)</span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isQuickCommandsExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className={`transition-all duration-300 ease-out overflow-hidden ${
            isQuickCommandsExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div
              className="p-4 space-y-3 max-h-80 overflow-y-auto"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                {quickCommands.map((cmd, index) => (
                  <button
                    key={index}
                    onClick={() => handleCommandSelect(cmd.command)}
                    className="group text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{cmd.icon}</span>
                      <span className="text-white font-medium text-sm">{cmd.label}</span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">{cmd.command}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
