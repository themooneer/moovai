import React, { useState } from 'react';
import { VideoProject, TimelineTrack, VideoClip } from '../types';
import { useProjectStore } from '../stores/projectStore';
import TimelineTrackComponent from './TimelineTrack';
import TimelineRuler from './TimelineRuler';

interface TimelineProps {
  project: VideoProject | null;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  compact?: boolean;
}

const Timeline: React.FC<TimelineProps> = ({ project, currentTime, onTimeUpdate, compact = false }) => {
  const { addClipToTrack, removeClipFromTrack, addTrack, removeTrack } = useProjectStore();
  const [zoom, setZoom] = useState(1);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);

  const handleClipDrop = (trackId: string, clip: VideoClip) => {
    addClipToTrack(trackId, clip);
  };

  const handleClipRemove = (trackId: string, clipId: string) => {
    removeClipFromTrack(trackId, clipId);
  };

  const handleAddTrack = (type: 'video' | 'audio' | 'overlay') => {
    const trackCount = project?.tracks.filter(t => t.type === type).length || 0;
    const trackName = `${type.charAt(0).toUpperCase() + type.slice(1)} Track ${trackCount + 1}`;
    addTrack(trackName, type);
  };

  const handleRemoveTrack = (trackId: string) => {
    removeTrack(trackId);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(0.1, Math.min(5, newZoom)));
  };

  const handleSeek = (time: number) => {
    onTimeUpdate?.(time);
  };

  if (!project) {
    return (
      <div className="timeline bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">No project loaded</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="timeline-compact bg-gray-800/50 rounded-xl overflow-hidden border border-white/10">
        {/* Compact Timeline Ruler */}
        <TimelineRuler
          currentTime={currentTime || 0}
          duration={project.duration}
          zoom={zoom}
          onSeek={handleSeek}
          compact={true}
        />

        {/* Compact Timeline Tracks */}
        <div className="timeline-tracks-compact overflow-x-auto">
          <div className="min-w-full" style={{ width: `${Math.max(400, project.duration * 50 * zoom)}px` }}>
            {project.tracks.slice(0, 3).map((track) => (
              <div key={track.id} className="h-8 border-b border-gray-600 last:border-b-0">
                <div className="flex items-center h-full px-2">
                  <span className="text-xs text-gray-400 w-20 truncate">{track.name}</span>
                  <div className="flex-1 h-full relative">
                    {track.clips.map((clip) => (
                      <div
                        key={clip.id}
                        className="absolute h-4 bg-blue-500/60 rounded top-1/2 transform -translate-y-1/2"
                        style={{
                          left: `${(clip.startTime / project.duration) * 100}%`,
                          width: `${(clip.duration / project.duration) * 100}%`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline bg-gray-800 rounded-lg overflow-hidden">
      {/* Timeline Header with Zoom Controls */}
      <div className="timeline-header bg-gray-700 px-4 py-2 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-white font-medium">Timeline</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleZoomChange(zoom - 0.2)}
                className="w-6 h-6 rounded bg-gray-600 hover:bg-gray-500 text-white text-xs flex items-center justify-center"
                disabled={zoom <= 0.1}
              >
                -
              </button>
              <span className="text-gray-300 text-sm w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => handleZoomChange(zoom + 0.2)}
                className="w-6 h-6 rounded bg-gray-600 hover:bg-gray-500 text-white text-xs flex items-center justify-center"
                disabled={zoom >= 5}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleAddTrack('video')}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              + Video
            </button>
            <button
              onClick={() => handleAddTrack('audio')}
              className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
            >
              + Audio
            </button>
            <button
              onClick={() => handleAddTrack('overlay')}
              className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded"
            >
              + Overlay
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Ruler */}
      <TimelineRuler
        currentTime={currentTime || 0}
        duration={project.duration}
        zoom={zoom}
        onSeek={handleSeek}
      />

      {/* Timeline Tracks */}
      <div className="timeline-tracks overflow-x-auto">
        <div className="min-w-full" style={{ width: `${Math.max(800, project.duration * 100 * zoom)}px` }}>
          {project.tracks.map((track) => (
            <TimelineTrackComponent
              key={track.id}
              track={track}
              zoom={zoom}
              onClipDrop={handleClipDrop}
              onClipRemove={handleClipRemove}
              onRemoveTrack={handleRemoveTrack}
              selectedClip={selectedClip}
              onClipSelect={setSelectedClip}
            />
          ))}
        </div>
      </div>

      {/* Empty State */}
      {project.tracks.length === 0 && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-400 mb-2">No tracks yet</p>
          <p className="text-gray-500 text-sm">Add tracks to start building your timeline</p>
        </div>
      )}
    </div>
  );
};

export default Timeline;
