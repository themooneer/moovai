import { promises as fs } from 'fs';
import path from 'path';
import { VideoProject, TimelineTrack, VideoClip } from '@ai-video-editor/shared';
import { generateId, createEmptyProject } from '@ai-video-editor/shared';

export class ProjectService {
  private projects: Map<string, VideoProject> = new Map();
  private projectsDir = 'projects';
  private initialized = false;

  constructor() {
    // Initialize the service asynchronously
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.ensureProjectsDirectory();
    this.initialized = true;
  }

  private async ensureProjectsDirectory(): Promise<void> {
    try {
      await fs.access(this.projectsDir);
    } catch {
      await fs.mkdir(this.projectsDir, { recursive: true });
      console.log('📁 Created projects directory');
    }
  }

  async createProject(
    name: string,
    resolution: { width: number; height: number } = { width: 1920, height: 1080 },
    fps: number = 30
  ): Promise<VideoProject> {
    console.log('🔄 ProjectService: Starting project creation...', { name, resolution, fps });

    // Ensure service is initialized
    if (!this.initialized) {
      console.log('🔄 ProjectService: Service not initialized, initializing...');
      await this.initialize();
    }

    const project = createEmptyProject(name);
    project.resolution = resolution;
    project.fps = fps;

    console.log('✅ ProjectService: Project created in memory:', project.id);
    this.projects.set(project.id, project);

    console.log('💾 ProjectService: Saving project to disk...');
    await this.saveProject(project);
    console.log('✅ ProjectService: Project saved to disk successfully');

    return project;
  }

  async getProject(projectId: string): Promise<VideoProject | null> {
    if (this.projects.has(projectId)) {
      return this.projects.get(projectId)!;
    }

    // Try to load from disk
    try {
      const projectPath = path.join(this.projectsDir, `${projectId}.json`);
      const projectData = await fs.readFile(projectPath, 'utf-8');
      const project = JSON.parse(projectData) as VideoProject;

      // Convert date strings back to Date objects
      project.tracks.forEach(track => {
        track.clips.forEach(clip => {
          if (typeof clip.startTime === 'string') {
            clip.startTime = parseFloat(clip.startTime);
          }
          if (typeof clip.endTime === 'string') {
            clip.endTime = parseFloat(clip.endTime);
          }
          if (typeof clip.duration === 'string') {
            clip.duration = parseFloat(clip.duration);
          }
        });
      });

      this.projects.set(projectId, project);
      return project;
    } catch (error) {
      console.error('Error loading project:', error);
      return null;
    }
  }

  async updateProject(projectId: string, updates: Partial<VideoProject>): Promise<VideoProject> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const updatedProject = { ...project, ...updates };
    this.projects.set(projectId, updatedProject);
    await this.saveProject(updatedProject);

    return updatedProject;
  }

  async deleteProject(projectId: string): Promise<void> {
    this.projects.delete(projectId);

    try {
      const projectPath = path.join(this.projectsDir, `${projectId}.json`);
      await fs.unlink(projectPath);
    } catch (error) {
      console.error('Error deleting project file:', error);
    }
  }

  async addTrack(
    projectId: string,
    name: string,
    type: 'video' | 'audio' | 'overlay'
  ): Promise<TimelineTrack> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const track: TimelineTrack = {
      id: generateId(),
      name,
      type,
      clips: [],
      enabled: true
    };

    project.tracks.push(track);
    await this.saveProject(project);

    return track;
  }

  async removeTrack(projectId: string, trackId: string): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    project.tracks = project.tracks.filter(t => t.id !== trackId);
    await this.saveProject(project);
  }

  async addClipToTrack(
    projectId: string,
    trackId: string,
    clip: VideoClip
  ): Promise<VideoClip> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const track = project.tracks.find(t => t.id === trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    track.clips.push(clip);

    // Update project duration
    const maxEndTime = Math.max(...track.clips.map(c => c.endTime));
    project.duration = Math.max(project.duration, maxEndTime);

    await this.saveProject(project);
    return clip;
  }

  async removeClipFromTrack(
    projectId: string,
    trackId: string,
    clipId: string
  ): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const track = project.tracks.find(t => t.id === trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    track.clips = track.clips.filter(c => c.id !== clipId);
    await this.saveProject(project);
  }

  async exportProject(
    projectId: string,
    outputPath: string,
    format: string = 'mp4'
  ): Promise<{ success: boolean; outputPath: string }> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // This would integrate with FFmpegService to actually export the project
    // For now, just return success
    return {
      success: true,
      outputPath
    };
  }

  async getAllProjects(): Promise<VideoProject[]> {
    try {
      const files = await fs.readdir(this.projectsDir);
      const projectFiles = files.filter(f => f.endsWith('.json'));

      const projects: VideoProject[] = [];
      for (const file of projectFiles) {
        const projectId = file.replace('.json', '');
        const project = await this.getProject(projectId);
        if (project) {
          projects.push(project);
        }
      }

      return projects;
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  }

  private async saveProject(project: VideoProject): Promise<void> {
    try {
      const projectPath = path.join(this.projectsDir, `${project.id}.json`);
      console.log('💾 ProjectService: Writing project to:', projectPath);

      await fs.writeFile(projectPath, JSON.stringify(project, null, 2));

      console.log('✅ ProjectService: Project file written successfully');
    } catch (error) {
      console.error('❌ ProjectService: Error saving project:', error);
      throw new Error('Failed to save project');
    }
  }
}
