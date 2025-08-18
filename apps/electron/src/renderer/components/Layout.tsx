import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Minimize, Maximize, X, ArrowLeft, Save, Download } from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { useAIChatStore } from '../stores/aiChatStore';
import AIChat from './AIChat';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { currentProject, saveProject } = useProjectStore();
  const { messages, sendMessage } = useAIChatStore();

  const handleSave = async () => {
    if (currentProject) {
      await saveProject(currentProject);
    }
  };

  const handleExport = async () => {
    if (currentProject) {
      // This would open a save dialog and export the project
      console.log('Export project:', currentProject.id);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleAIMessage = async (content: string) => {
    if (!content.trim()) return;
    await sendMessage(content, currentProject);
  };

  return (
    <div className="layout h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Title Bar */}
      <div className="title-bar bg-black/20 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="title-bar-left flex items-center space-x-6">
          <button
            onClick={handleBack}
            className="group px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105 flex items-center space-x-2"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Back to Projects</span>
          </button>

          {currentProject && (
            <div className="project-info flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h1 className="project-title text-xl font-bold text-white">{currentProject.name}</h1>
              <div className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm font-medium rounded-full">
                {Math.floor(currentProject.duration / 60)}:{(currentProject.duration % 60).toFixed(0).padStart(2, '0')}
              </div>
            </div>
          )}
        </div>

        <div className="title-bar-center">
          <div className="app-title text-lg font-semibold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Video Editor
          </div>
        </div>

        <div className="title-bar-right flex items-center space-x-4">
          <button
            onClick={handleSave}
            className="btn-save px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-medium rounded-xl border border-blue-500/30 hover:border-blue-500/50 transition-all duration-200 hover:scale-105 flex items-center space-x-2"
            title="Save Project"
          >
            <Save size={16} />
            <span>Save</span>
          </button>

          <button
            onClick={handleExport}
            className="btn-export px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 hover:text-green-200 rounded-xl border border-green-500/30 hover:border-green-500/50 transition-all duration-200 hover:scale-105 flex items-center space-x-2"
            title="Export Project"
          >
            <Download size={16} />
            <span>Export</span>
          </button>

          <div className="window-controls flex items-center space-x-1">
            <button
              onClick={() => window.electronAPI?.minimize()}
              className="w-8 h-8 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
              title="Minimize"
            >
              <Minimize size={12} />
            </button>
            <button
              onClick={() => window.electronAPI?.maximize()}
              className="w-8 h-8 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
              title="Maximize"
            >
              <Maximize size={12} />
            </button>
            <button
              onClick={() => window.electronAPI?.close()}
              className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
              title="Close"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Video Editor */}
      <div className="layout-content flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};

export default Layout;
