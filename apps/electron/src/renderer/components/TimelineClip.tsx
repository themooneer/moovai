import React from 'react';
import { VideoClip } from '../types';

interface TimelineClipProps {
  clip: VideoClip;
  zoom: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

const TimelineClip: React.FC<TimelineClipProps> = ({
  clip,
  zoom,
  isSelected,
  onSelect,
  onRemove
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(clip));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    } else if (e.key === 'Delete') {
      e.preventDefault();
      onRemove();
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate clip position and width based on zoom and timing
  const clipLeft = (clip.startTime / 100) * zoom * 100; // Assuming 100px = 1 second at zoom 1
  const clipWidth = (clip.duration / 100) * zoom * 100;

  return (
    <div
      className={`
        timeline-clip absolute top-1 bottom-1 rounded-xl cursor-pointer transition-all duration-300
        ${isSelected
          ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900 bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25'
          : 'bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-400 hover:to-blue-500 hover:shadow-lg hover:shadow-blue-500/20'
        }
        min-w-16 backdrop-blur-sm
      `}
      style={{
        left: `${clipLeft}px`,
        width: `${Math.max(clipWidth, 64)}px`, // Minimum width for visibility
        zIndex: isSelected ? 10 : 1
      }}
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${clip.name} (${formatTime(clip.duration)})`}
      title={`${clip.name} - ${formatTime(clip.duration)}`}
    >
      {/* Clip Content */}
      <div className="h-full flex flex-col justify-between p-3 text-white">
        {/* Clip Name */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold truncate flex-1 text-white">
            {clip.name}
          </span>
          {isSelected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="w-5 h-5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-red-100 text-xs flex items-center justify-center ml-2 transition-all duration-200 hover:scale-110 border border-red-500/30 hover:border-red-500/50"
              title="Remove clip"
            >
              ×
            </button>
          )}
        </div>

        {/* Clip Duration */}
        <div className="text-xs opacity-90 mt-auto font-medium">
          {formatTime(clip.duration)}
        </div>

        {/* Clip Thumbnail (if available) */}
        {clip.thumbnail && (
          <div className="absolute inset-0 opacity-30 pointer-events-none rounded-xl overflow-hidden">
            <img
              src={clip.thumbnail}
              alt={clip.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute inset-0 border-2 border-blue-300 rounded-xl pointer-events-none"></div>
        )}
      </div>

      {/* Resize Handles (for future implementation) */}
      {isSelected && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-300 cursor-ew-resize hover:bg-blue-200 rounded-l-xl transition-colors duration-200"
            title="Drag to resize start time"
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-1.5 bg-blue-300 cursor-ew-resize hover:bg-blue-200 rounded-r-xl transition-colors duration-200"
            title="Drag to resize end time"
          />
        </>
      )}
    </div>
  );
};

export default TimelineClip;
