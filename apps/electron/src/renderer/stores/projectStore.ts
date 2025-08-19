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
    console.log('🔄 ProjectStore: Starting project creation...', { name, resolution, fps });
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/project', { name, resolution, fps });
      const newProject = response.data.project;
      console.log('✅ ProjectStore: Backend response received:', newProject);

      set(state => {
        console.log('🔄 ProjectStore: Updating state with new project...');
        const updatedState = {
          projects: [...state.projects, newProject],
          currentProject: newProject,
          isLoading: false
        };
        console.log('✅ ProjectStore: State updated:', updatedState);
        return updatedState;
      });
      return newProject;
    } catch (error) {
      console.error('❌ ProjectStore: Project creation failed:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create project',
        isLoading: false
      });
    }
  },

  loadProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/project/${projectId}`);
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
      await api.put(`/project/${project.id}`, project);

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
      await api.delete(`/project/${projectId}`);

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

    // If trackId is 'default', create a new video track
    if (trackId === 'default') {
      const newTrack: TimelineTrack = {
        id: Math.random().toString(36).substr(2, 9),
        name: 'Video Track 1',
        type: 'video',
        clips: [],
        enabled: true
      };
      updatedProject.tracks = [...updatedProject.tracks, newTrack];
      trackId = newTrack.id;
    }

    const trackIndex = updatedProject.tracks.findIndex(t => t.id === trackId);
    if (trackIndex !== -1) {
      // Create a new track with the updated clips array
      const updatedTrack = {
        ...updatedProject.tracks[trackIndex],
        clips: [...updatedProject.tracks[trackIndex].clips, clip]
      };

      // Update the tracks array immutably
      updatedProject.tracks = [
        ...updatedProject.tracks.slice(0, trackIndex),
        updatedTrack,
        ...updatedProject.tracks.slice(trackIndex + 1)
      ];

      updatedProject.duration = Math.max(updatedProject.duration, clip.endTime);

      console.log('🎬 ProjectStore: Adding clip to track, updated project:', updatedProject);
      set({ currentProject: updatedProject });
    }
  },

  removeClipFromTrack: (trackId: string, clipId: string) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedProject = { ...currentProject };
    const trackIndex = updatedProject.tracks.findIndex(t => t.id === trackId);

    if (trackIndex !== -1) {
      const track = updatedProject.tracks[trackIndex];
      const updatedTrack = {
        ...track,
        clips: track.clips.filter(c => c.id !== clipId)
      };

      // Update the tracks array immutably
      updatedProject.tracks = [
        ...updatedProject.tracks.slice(0, trackIndex),
        updatedTrack,
        ...updatedProject.tracks.slice(trackIndex + 1)
      ];

      // Recalculate project duration
      const maxEndTime = Math.max(...updatedTrack.clips.map(c => c.endTime), 0);
      updatedProject.duration = Math.max(updatedProject.duration, maxEndTime);

      set({ currentProject: updatedProject });
    }
  },

  updateClip: (trackId: string, clipId: string, updates: Partial<VideoClip>) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedProject = { ...currentProject };
    const trackIndex = updatedProject.tracks.findIndex(t => t.id === trackId);

    if (trackIndex !== -1) {
      const track = updatedProject.tracks[trackIndex];
      const clipIndex = track.clips.findIndex(c => c.id === clipId);

      if (clipIndex !== -1) {
        const updatedClip = { ...track.clips[clipIndex], ...updates };
        const updatedTrack = {
          ...track,
          clips: [
            ...track.clips.slice(0, clipIndex),
            updatedClip,
            ...track.clips.slice(clipIndex + 1)
          ]
        };

        // Update the tracks array immutably
        updatedProject.tracks = [
          ...updatedProject.tracks.slice(0, trackIndex),
          updatedTrack,
          ...updatedProject.tracks.slice(trackIndex + 1)
        ];

        // Recalculate project duration
        const maxEndTime = Math.max(...updatedTrack.clips.map(c => c.endTime), 0);
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
