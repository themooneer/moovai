import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useProjectStore } from './stores/projectStore';
import { useAIChatStore } from './stores/aiChatStore';
import Layout from './components/Layout';
import ProjectList from './components/ProjectList';
import VideoEditor from './components/VideoEditor';
import AIChat from './components/AIChat';
import Timeline from './components/Timeline';
import './App.css';

function App() {
  const { currentProject, projects, setCurrentProject } = useProjectStore();
  const { messages } = useAIChatStore();
  const navigate = useNavigate();

  // Create sample projects if none exist
  React.useEffect(() => {
    if (projects.length === 0) {
      const sampleProjects = [
        {
          id: 'sample-1',
          name: 'Sample Project 1',
          tracks: [
            {
              id: 'video-track-1',
              name: 'Video Track 1',
              type: 'video' as const,
              clips: [],
              enabled: true
            },
            {
              id: 'audio-track-1',
              name: 'Audio Track 1',
              type: 'audio' as const,
              clips: [],
              enabled: true
            }
          ],
          duration: 60,
          resolution: { width: 1920, height: 1080 },
          fps: 30
        },
        {
          id: 'sample-2',
          name: 'Sample Project 2',
          tracks: [
            {
              id: 'video-track-2',
              name: 'Video Track 1',
              type: 'video' as const,
              clips: [],
              enabled: true
            }
          ],
          duration: 30,
          resolution: { width: 1280, height: 720 },
          fps: 24
        }
      ];

      useProjectStore.setState(state => ({
        projects: sampleProjects,
        currentProject: sampleProjects[0]
      }));
    }
  }, [projects.length]);

  // Create a simple test project if none exists
  const testProject = {
    id: 'test-project',
    name: 'Test Project',
    tracks: [
      {
        id: 'video-track-1',
        name: 'Video Track 1',
        type: 'video' as const,
        clips: [],
        enabled: true
      },
      {
        id: 'audio-track-1',
        name: 'Audio Track 1',
        type: 'audio' as const,
        clips: [],
        enabled: true
      }
    ],
    duration: 60,
    resolution: { width: 1920, height: 1080 },
    fps: 30
  };

  return (
    <div className="App min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Routes>
        {/* Default route - redirect to home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Home route */}
        <Route path="/home" element={
          <div className="min-h-screen flex items-center justify-center p-8">
            <div className="text-center max-w-4xl">
              {/* Hero Section */}
              <div className="mb-16">
                <div className="w-32 h-32 mx-auto mb-8 text-purple-400/60">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  AI Video Editor
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
                  Transform your videos with the power of AI. Edit, enhance, and create stunning content with natural language commands.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button
                  onClick={() => navigate('/editor/test')}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-lg rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 flex items-center space-x-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Start Editing</span>
                </button>

                <button
                  onClick={() => navigate('/projects')}
                  className="group px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold text-lg rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/25 flex items-center space-x-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>View Projects</span>
                </button>
              </div>

              {/* Features Grid */}
              <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: '🤖',
                    title: 'AI-Powered',
                    description: 'Natural language commands for intuitive video editing'
                  },
                  {
                    icon: '⚡',
                    title: 'Lightning Fast',
                    description: 'Real-time processing with optimized algorithms'
                  },
                  {
                    icon: '🎨',
                    title: 'Professional',
                    description: 'Studio-quality effects and transitions'
                  }
                ].map((feature, index) => (
                  <div key={index} className="group p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        } />

        {/* Projects route */}
        <Route path="/projects" element={<ProjectList />} />

        {/* Editor route */}
        <Route path="/editor/:projectId" element={
          <Layout>
            <VideoEditor />
          </Layout>
        } />

        {/* Test route - simple content to verify routing works */}
        <Route path="/test" element={
          <div className="min-h-screen flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 text-green-400/60">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-white mb-6">Test Route Working!</h1>
              <p className="text-xl text-gray-300 mb-8">If you can see this, routing is working perfectly!</p>
              <button
                onClick={() => navigate('/home')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-lg rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25"
              >
                Go Home
              </button>
            </div>
          </div>
        } />

        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  );
}

export default App;
