import React, { useState, useRef, useEffect } from 'react';
import { VideoProject, TimelineTrack, VideoClip } from '../types';
import { useProjectStore } from '../stores/projectStore';
import TimelineTrackComponent from './TimelineTrack';
import TimelineRuler from './TimelineRuler';

interface TimelineProps {
  project: VideoProject | null;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  compact?: boolean;
  videoDuration?: number;
  onVideoDurationUpdate?: (duration: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ project, currentTime, onTimeUpdate, compact = false, videoDuration, onVideoDurationUpdate }) => {
  const { addClipToTrack, removeClipFromTrack, addTrack, removeTrack } = useProjectStore();
  const [zoom, setZoom] = useState(1);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);

  // Use actual video duration for perfect sync, fallback to project duration
  const effectiveDuration = videoDuration || project?.duration || 0;

  // Auto-scroll timeline to keep current time visible
  useEffect(() => {
    if (timelineRef.current && tracksContainerRef.current && currentTime && effectiveDuration) {
      const timelineWidth = timelineRef.current.offsetWidth;
      const totalWidth = Math.max(800, effectiveDuration * 100 * zoom);
      const currentTimePosition = (currentTime / effectiveDuration) * totalWidth;
      const scrollPosition = currentTimePosition - (timelineWidth / 2);

      // Smooth scroll to keep current time centered
      tracksContainerRef.current.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [currentTime, zoom, effectiveDuration]);

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

  // Enhanced seeking with visual feedback
  const handleTimelineSeek = (time: number) => {
    onTimeUpdate?.(time);

    // Add visual feedback
    if (timelineRef.current) {
      timelineRef.current.style.transform = 'scale(1.02)';
      setTimeout(() => {
        if (timelineRef.current) {
          timelineRef.current.style.transform = 'scale(1)';
        }
      }, 150);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
          duration={effectiveDuration}
          zoom={zoom}
          onSeek={handleTimelineSeek}
          compact={true}
        />

        {/* Compact Timeline Tracks */}
        <div className="timeline-tracks-compact overflow-x-auto">
          <div className="min-w-full" style={{ width: `${Math.max(400, effectiveDuration * 50 * zoom)}px` }}>
            {project.tracks
              .filter(track => track.type === 'video') // Only show video tracks
              .slice(0, 3)
              .map((track) => (
                <div key={track.id} className="h-8 border-b border-gray-600 last:border-b-0">
                  <div className="flex items-center h-full px-2">
                    <span className="text-xs text-gray-400 w-20 truncate">{track.name}</span>
                    <div className="flex-1 h-full relative">
                      {track.clips.map((clip) => (
                        <div
                          key={clip.id}
                          className="absolute h-4 bg-blue-500/60 rounded top-1/2 transform -translate-y-1/2"
                          style={{
                            left: `${(clip.startTime / effectiveDuration) * 100}%`,
                            width: `${(clip.duration / effectiveDuration) * 100}%`
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
    <div className="timeline bg-gray-800 rounded-lg overflow-hidden" ref={timelineRef}>
      {/* Timeline Header with Zoom Controls */}
      <div className="timeline-header bg-gray-700 px-4 py-2 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-white font-medium">Video Timeline</h3>
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
            <span className="text-gray-400 text-sm">
              Duration: {formatTime(effectiveDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Ruler */}
      <TimelineRuler
        currentTime={currentTime || 0}
        duration={effectiveDuration}
        zoom={zoom}
        onSeek={handleTimelineSeek}
      />

      {/* Timeline Tracks */}
      <div className="timeline-tracks overflow-x-auto" ref={tracksContainerRef}>
        <div className="min-w-full" style={{ width: `${Math.max(800, effectiveDuration * 100 * zoom)}px` }}>
          {project.tracks
            .filter(track => track.type === 'video') // Only show video tracks
            .map((track) => (
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
      {project.tracks.filter(track => track.type === 'video').length === 0 && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-400 mb-2">No video tracks</p>
          <p className="text-gray-500 text-sm">Import a video to see it in the timeline</p>
        </div>
      )}
    </div>
  );
};

export default Timeline;
