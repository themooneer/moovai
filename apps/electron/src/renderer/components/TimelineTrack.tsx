import React from 'react';
import { TimelineTrack as TimelineTrackType, VideoClip } from '../types';
import TimelineClip from './TimelineClip';

interface TimelineTrackProps {
  track: TimelineTrackType;
  zoom: number;
  onClipDrop: (trackId: string, clip: VideoClip) => void;
  onClipRemove: (trackId: string, clipId: string) => void;
  onRemoveTrack: (trackId: string) => void;
  selectedClip: string | null;
  onClipSelect: (clipId: string | null) => void;
}

const TimelineTrack: React.FC<TimelineTrackProps> = ({
  track,
  zoom,
  onClipDrop,
  onClipRemove,
  onRemoveTrack,
  selectedClip,
  onClipSelect
}) => {
  const getTrackTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-blue-600';
      case 'audio':
        return 'bg-green-600';
      case 'overlay':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getTrackTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        );
      case 'audio':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.784L4.5 13.5H2a1 1 0 01-1-1v-5a1 1 0 011-1h2.5l3.883-3.284A1 1 0 019.383 3.076zM12.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-4.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm3.536 1.05a1 1 0 011.414 0A6.973 6.973 0 0121 10a6.973 6.973 0 01-3.536 6.021 1 1 0 01-1.414-1.414A4.973 4.973 0 0019 10c0-1.38-.56-2.63-1.464-3.536a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'overlay':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-gray-700');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-gray-700');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-700');

    try {
      const clipData = e.dataTransfer.getData('application/json');
      if (clipData) {
        const clip: VideoClip = JSON.parse(clipData);
        onClipDrop(track.id, clip);
      }
    } catch (error) {
      console.error('Failed to parse dropped clip data:', error);
    }
  };

  return (
    <div className="timeline-track border-b border-white/10 min-h-16 bg-white/5">
      {/* Track Header */}
      <div className="track-header bg-white/10 px-4 py-3 flex items-center justify-between min-w-48 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getTrackTypeColor(track.type)} shadow-lg`}></div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
              {getTrackTypeIcon(track.type)}
            </div>
            <span className="text-white text-sm font-medium">{track.name}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onRemoveTrack(track.id)}
            className="w-6 h-6 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 text-sm flex items-center justify-center transition-all duration-200 hover:scale-105 border border-red-500/30 hover:border-red-500/50"
            title="Remove track"
          >
            ×
          </button>
        </div>
      </div>

      {/* Track Content */}
      <div
        className="track-content relative h-12 bg-white/5"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Track Background */}
        <div className="absolute inset-0 bg-white/5"></div>

        {/* Clips */}
        {track.clips.map((clip) => (
          <TimelineClip
            key={clip.id}
            clip={clip}
            zoom={zoom}
            isSelected={selectedClip === clip.id}
            onSelect={() => onClipSelect(clip.id)}
            onRemove={() => onClipRemove(track.id, clip.id)}
          />
        ))}

        {/* Empty State */}
        {track.clips.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 text-gray-400/60">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-400 text-xs font-medium">Drop clips here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineTrack;
