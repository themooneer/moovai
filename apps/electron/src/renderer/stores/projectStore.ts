import { create } from 'zustand';
import { VideoProject, VideoClip, TimelineTrack } from '../types';
import { api } from '../services/api';

interface ProjectState {
  projects: VideoProject[];
  currentProject: VideoProject | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createProject: (name: string, resolution?: { width: number; height: number }, fps?: number) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: (project: VideoProject) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addClipToTrack: (trackId: string, clip: VideoClip) => void;
  removeClipFromTrack: (trackId: string, clipId: string) => void;
  updateClip: (trackId: string, clipId: string, updates: Partial<VideoClip>) => void;
  addTrack: (name: string, type: 'video' | 'audio' | 'overlay') => void;
  removeTrack: (trackId: string) => void;
  setCurrentProject: (project: VideoProject | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  createProject: async (name: string, resolution = { width: 1920, height: 1080 }, fps = 30) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/project', { name, resolution, fps });
      const newProject = response.data.project;

      set(state => ({
        projects: [...state.projects, newProject],
        currentProject: newProject,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create project',
        isLoading: false
      });
    }
  },

  loadProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/api/project/${projectId}`);
      const project = response.data;

      set({ currentProject: project, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load project',
        isLoading: false
      });
    }
  },

  saveProject: async (project: VideoProject) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/api/project/${project.id}`, project);

      set(state => ({
        projects: state.projects.map(p => p.id === project.id ? project : p),
        currentProject: state.currentProject?.id === project.id ? project : state.currentProject,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save project',
        isLoading: false
      });
    }
  },

  deleteProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/project/${projectId}`);

      set(state => ({
        projects: state.projects.filter(p => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete project',
        isLoading: false
      });
    }
  },

  addClipToTrack: (trackId: string, clip: VideoClip) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedProject = { ...currentProject };
    const track = updatedProject.tracks.find(t => t.id === trackId);
    if (track) {
      track.clips.push(clip);
      updatedProject.duration = Math.max(updatedProject.duration, clip.endTime);

      set({ currentProject: updatedProject });
    }
  },

  removeClipFromTrack: (trackId: string, clipId: string) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedProject = { ...currentProject };
    const track = updatedProject.tracks.find(t => t.id === trackId);
    if (track) {
      track.clips = track.clips.filter(c => c.id !== clipId);

      // Recalculate project duration
      const maxEndTime = Math.max(...track.clips.map(c => c.endTime), 0);
      updatedProject.duration = Math.max(updatedProject.duration, maxEndTime);

      set({ currentProject: updatedProject });
    }
  },

  updateClip: (trackId: string, clipId: string, updates: Partial<VideoClip>) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedProject = { ...currentProject };
    const track = updatedProject.tracks.find(t => t.id === trackId);
    if (track) {
      const clipIndex = track.clips.findIndex(c => c.id === clipId);
      if (clipIndex !== -1) {
        track.clips[clipIndex] = { ...track.clips[clipIndex], ...updates };

        // Recalculate project duration
        const maxEndTime = Math.max(...track.clips.map(c => c.endTime), 0);
        updatedProject.duration = Math.max(updatedProject.duration, maxEndTime);

        set({ currentProject: updatedProject });
      }
    }
  },

  addTrack: (name: string, type: 'video' | 'audio' | 'overlay') => {
    const { currentProject } = get();
    if (!currentProject) return;

    const newTrack: TimelineTrack = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      clips: [],
      enabled: true
    };

    const updatedProject = {
      ...currentProject,
      tracks: [...currentProject.tracks, newTrack]
    };

    set({ currentProject: updatedProject });
  },

  removeTrack: (trackId: string) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedProject = {
      ...currentProject,
      tracks: currentProject.tracks.filter(t => t.id !== trackId)
    };

    set({ currentProject: updatedProject });
  },

  setCurrentProject: (project: VideoProject | null) => {
    set({ currentProject: project });
  },

  clearError: () => {
    set({ error: null });
  }
}));
