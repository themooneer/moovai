import React, { useState } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useAIChatStore } from '../stores/aiChatStore';
import VideoPlayer from './VideoPlayer';
import Timeline from './Timeline';
import AIChat from './AIChat';

const VideoEditor: React.FC = () => {
  const { currentProject, saveProject } = useProjectStore();
  const { messages, sendMessage } = useAIChatStore();
  const [currentTime, setCurrentTime] = useState(0);
  const [isTopBarCollapsed, setIsTopBarCollapsed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleAIMessage = async (content: string) => {
    await sendMessage(content, currentProject);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleSaveProject = async () => {
    if (currentProject) {
      await saveProject(currentProject);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    // TODO: Implement export functionality
    setTimeout(() => setIsExporting(false), 2000);
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 text-gray-500 opacity-50">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-100 mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            No Project Loaded
          </h2>
          <p className="text-gray-400 text-lg">Please select a project to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Top Bar - Collapsible */}
      <div className={`bg-black/20 border-b border-white/10 transition-all duration-300 ease-out ${
        isTopBarCollapsed ? 'h-16' : 'h-24'
      }`}>
        <div className="flex items-center justify-between px-6 h-full">
          {/* Left Side - Project Info & Timeline Toggle */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setIsTopBarCollapsed(!isTopBarCollapsed)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 hover:scale-105"
            >
              <svg className={`w-5 h-5 text-gray-300 transition-transform duration-300 ${
                isTopBarCollapsed ? 'rotate-180' : ''
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">{currentProject.name}</h1>
              <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium">
                {currentProject.resolution.width}×{currentProject.resolution.height}
              </div>
              <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium">
                {currentProject.fps} FPS
              </div>
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSaveProject}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
            >
              Save Project
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Exporting...</span>
                </div>
              ) : (
                'Export Video'
              )}
            </button>
          </div>
        </div>

        {/* Timeline Preview - Hidden when collapsed */}
        {!isTopBarCollapsed && (
          <div className="px-6 pb-4">
            <Timeline
              project={currentProject}
              currentTime={currentTime}
              onTimeUpdate={handleTimeUpdate}
              compact={true}
            />
          </div>
        )}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex">
        {/* Left Side - Video Preview & Controls */}
        <div className="flex-1 flex flex-col p-6">
          {/* Video Player with Glassmorphism Frame */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative group">
              {/* Glassmorphism Frame */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/20 shadow-2xl"></div>
              <div className="absolute inset-1 bg-gradient-to-br from-white/5 to-transparent rounded-2xl"></div>

              {/* Video Container */}
              <div className="relative z-10 p-2">
                <VideoPlayer
                  project={currentProject}
                  currentTime={currentTime}
                  onTimeUpdate={handleTimeUpdate}
                />
              </div>

              {/* Floating Add Button */}
              <button className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center group">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <div className="absolute top-full mt-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  Add Effects & Transitions
                </div>
              </button>
            </div>
          </div>

          {/* Quick Commands */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Commands</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: '✂️', label: 'Trim', command: 'Trim the video to 30 seconds' },
                { icon: '🎨', label: 'Filters', command: 'Apply cinematic color grading' },
                { icon: '🔊', label: 'Audio', command: 'Add background music' },
                { icon: '📐', label: 'Resize', command: 'Resize to 1080p' }
              ].map((cmd, index) => (
                <button
                  key={index}
                  onClick={() => handleAIMessage(cmd.command)}
                  className="group p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <div className="text-2xl mb-2">{cmd.icon}</div>
                  <div className="text-white font-medium text-sm">{cmd.label}</div>
                  <div className="text-gray-400 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {cmd.command}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - AI Command Panel */}
        <div className="w-96 border-l border-white/10 bg-black/20">
          <AIChat
            messages={messages}
            onSendMessage={handleAIMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
