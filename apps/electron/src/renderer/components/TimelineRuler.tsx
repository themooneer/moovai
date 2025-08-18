import React from 'react';

interface TimelineRulerProps {
  currentTime: number;
  duration: number;
  zoom: number;
  onSeek: (time: number) => void;
  compact?: boolean;
}

const TimelineRuler: React.FC<TimelineRulerProps> = ({ currentTime, duration, zoom, onSeek, compact = false }) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const rulerWidth = rect.width;
    const clickTime = (clickX / rulerWidth) * duration;
    onSeek(Math.max(0, Math.min(duration, clickTime)));
  };

  // Calculate time markers based on zoom level
  const getTimeMarkers = () => {
    const markers = [];
    const step = Math.max(1, Math.floor(10 / zoom)); // Adjust marker density based on zoom

    for (let i = 0; i <= duration; i += step) {
      markers.push(i);
    }

    return markers;
  };

  const timeMarkers = getTimeMarkers();

  if (compact) {
    return (
      <div className="timeline-ruler-compact bg-gray-700/50 border-b border-gray-600/50 relative">
        <div
          className="ruler-click-area h-6 cursor-pointer relative"
          onClick={handleRulerClick}
        >
          {/* Simplified Time Markers for Compact Mode */}
          {[0, duration / 2, duration].map((time) => (
            <div
              key={time}
              className="absolute top-0 bottom-0 flex flex-col items-center"
              style={{
                left: `${(time / duration) * 100}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="w-px h-3 bg-gray-500/60"></div>
              <span className="text-xs text-gray-400/80 mt-0.5 whitespace-nowrap">
                {formatTime(time)}
              </span>
            </div>
          ))}

          {/* Current Time Indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
            style={{
              left: `${(currentTime / duration) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="w-2 h-2 bg-red-500 rounded-full -ml-1 -mt-1"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-ruler bg-gray-700 border-b border-gray-600 relative">
      <div
        className="ruler-click-area h-8 cursor-pointer relative"
        onClick={handleRulerClick}
      >
        {/* Time Markers */}
        {timeMarkers.map((time) => (
          <div
            key={time}
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{
              left: `${(time / duration) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="w-px h-4 bg-gray-500"></div>
            <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">
              {formatTime(time)}
            </span>
          </div>
        ))}

        {/* Current Time Indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{
            left: `${(currentTime / duration) * 100}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 -mt-1.5"></div>
        </div>

        {/* Playhead Line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
          style={{
            left: `${(currentTime / duration) * 100}%`,
            transform: 'translateX(-50%)'
          }}
        />
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute top-1 right-2 text-xs text-gray-400">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};

export default TimelineRuler;
