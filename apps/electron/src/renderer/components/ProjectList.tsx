import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Video, Clock, Settings } from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const { projects, setCurrentProject } = useProjectStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    resolution: '1920x1080',
    fps: '30'
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const [width, height] = formData.resolution.split('x').map(Number);

    // Create project locally without API call
    const newProject = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      tracks: [
        {
          id: Math.random().toString(36).substr(2, 9),
          name: 'Video Track 1',
          type: 'video' as const,
          clips: [],
          enabled: true
        },
        {
          id: Math.random().toString(36).substr(2, 9),
          name: 'Audio Track 1',
          type: 'audio' as const,
          clips: [],
          enabled: true
        }
      ],
      duration: 0,
      resolution: { width, height },
      fps: Number(formData.fps)
    };

    // Add to store locally
    useProjectStore.setState(state => ({
      projects: [...state.projects, newProject],
      currentProject: newProject
    }));

    setShowCreateForm(false);
    setFormData({ name: '', resolution: '1920x1080', fps: '30' });

    // Navigate to the new project
    navigate(`/editor/${newProject.id}`);
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/editor/${projectId}`);
  };

  const handleBackToHome = () => {
    navigate('/home');
  };

  return (
    <div className="project-list min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Video Editor
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">Create and edit videos with AI assistance</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleBackToHome}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            >
              ← Back to Home
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
            >
              <Plus size={20} />
              New Project
            </button>
          </div>
        </div>

        {/* Create Project Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800/90 rounded-3xl border border-white/20 p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">Create New Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-white font-medium text-sm">Project Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-white font-medium text-sm">Resolution</label>
                    <select
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      value={formData.resolution}
                      onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    >
                      <option value="1920x1080">1920x1080 (Full HD)</option>
                      <option value="1280x720">1280x720 (HD)</option>
                      <option value="3840x2160">3840x2160 (4K)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-white font-medium text-sm">Frame Rate</label>
                    <select
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      value={formData.fps}
                      onChange={(e) => setFormData({ ...formData, fps: e.target.value })}
                    >
                      <option value="24">24 fps</option>
                      <option value="30">30 fps</option>
                      <option value="60">60 fps</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-2xl transition-all duration-200 hover:scale-105"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group project-card bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-white/10"
              onClick={() => handleProjectClick(project.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white truncate flex-1 mr-3">{project.name}</h3>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                  <Video size={20} className="text-blue-400" />
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-sm">
                    {Math.floor(project.duration / 60)}:{(project.duration % 60).toFixed(0).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Settings size={16} className="text-gray-400" />
                  <span className="text-sm">{project.resolution.width}×{project.resolution.height}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm">{project.fps} fps</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{project.tracks.length} tracks</span>
                  <span>• {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Create New Project Card */}
          <div
            className="group create-project-card bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl border-2 border-dashed border-purple-400/30 hover:border-purple-400/50 p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:from-purple-500/20 hover:to-blue-500/20"
            onClick={() => setShowCreateForm(true)}
          >
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Plus size={32} className="text-white" />
              </div>
              <div className="text-lg font-semibold text-white mb-2">Create New Project</div>
              <div className="text-sm text-gray-300">Start editing with AI assistance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectList;
