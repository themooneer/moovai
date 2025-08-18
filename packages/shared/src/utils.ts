import { VideoClip, TimelineTrack, VideoProject } from './types';

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function parseTime(timeString: string): number {
  const parts = timeString.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

export function createEmptyProject(name: string): VideoProject {
  return {
    id: generateId(),
    name,
    tracks: [
      {
        id: generateId(),
        name: 'Video Track 1',
        type: 'video',
        clips: [],
        enabled: true
      },
      {
        id: generateId(),
        name: 'Audio Track 1',
        type: 'audio',
        clips: [],
        enabled: true
      }
    ],
    duration: 0,
    resolution: { width: 1920, height: 1080 },
    fps: 30
  };
}

export function addClipToTrack(
  project: VideoProject,
  trackId: string,
  clip: VideoClip
): VideoProject {
  const trackIndex = project.tracks.findIndex(t => t.id === trackId);
  if (trackIndex === -1) return project;

  const updatedTracks = [...project.tracks];
  updatedTracks[trackIndex] = {
    ...updatedTracks[trackIndex],
    clips: [...updatedTracks[trackIndex].clips, clip]
  };

  return {
    ...project,
    tracks: updatedTracks,
    duration: Math.max(project.duration, clip.endTime)
  };
}

export function removeClipFromTrack(
  project: VideoProject,
  trackId: string,
  clipId: string
): VideoProject {
  const trackIndex = project.tracks.findIndex(t => t.id === trackId);
  if (trackIndex === -1) return project;

  const updatedTracks = [...project.tracks];
  updatedTracks[trackIndex] = {
    ...updatedTracks[trackIndex],
    clips: updatedTracks[trackIndex].clips.filter(c => c.id !== clipId)
  };

  return {
    ...project,
    tracks: updatedTracks
  };
}
