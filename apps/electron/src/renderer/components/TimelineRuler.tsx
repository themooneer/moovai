import React, { useRef, useEffect, useState } from 'react';

interface TimelineRulerProps {
  currentTime: number;
  duration: number;
  zoom: number;
  onSeek: (time: number) => void;
  compact?: boolean;
}

const TimelineRuler: React.FC<TimelineRulerProps> = ({ currentTime, duration, zoom, onSeek, compact = false }) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate time from mouse position
  const getTimeFromPosition = (clientX: number): number => {
    if (!rulerRef.current) return 0;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const rulerWidth = rect.width;
    const clickTime = (clickX / rulerWidth) * duration;
    return Math.max(0, Math.min(duration, clickTime));
  };

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const time = getTimeFromPosition(e.clientX);
    onSeek(time);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const time = getTimeFromPosition(e.clientX);
    setDragTime(time);
    onSeek(time);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const time = getTimeFromPosition(e.clientX);
      setDragTime(time);
      onSeek(time);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTime(null);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const time = getTimeFromPosition(e.clientX);
        setDragTime(time);
        onSeek(time);
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        setDragTime(null);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, duration]);

  // Calculate time markers based on zoom level and duration
  const getTimeMarkers = () => {
    const markers = [];

    // Adaptive marker density based on duration and zoom
    let step = 1; // Default 1 second

    if (duration > 300) { // 5+ minutes
      step = Math.max(5, Math.floor(30 / zoom));
    } else if (duration > 60) { // 1+ minute
      step = Math.max(1, Math.floor(10 / zoom));
    } else { // Less than 1 minute
      step = Math.max(0.5, Math.floor(5 / zoom));
    }

    for (let i = 0; i <= duration; i += step) {
      markers.push(i);
    }

    return markers;
  };

  const timeMarkers = getTimeMarkers();
  const displayTime = isDragging && dragTime !== null ? dragTime : currentTime;

  if (compact) {
    return (
      <div className="timeline-ruler-compact bg-gray-700/50 border-b border-gray-600/50 relative">
        <div
          ref={rulerRef}
          className="ruler-click-area h-6 cursor-pointer relative select-none"
          onClick={handleRulerClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
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
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 transition-all duration-75 ease-out"
            style={{
              left: `${(displayTime / duration) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="w-2 h-2 bg-red-500 rounded-full -ml-1 -mt-1 shadow-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-ruler bg-gray-700 border-b border-gray-600 relative">
      <div
        ref={rulerRef}
        className="ruler-click-area h-8 cursor-pointer relative select-none"
        onClick={handleRulerClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
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
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 transition-all duration-75 ease-out"
          style={{
            left: `${(displayTime / duration) * 100}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 -mt-1.5 shadow-lg"></div>
        </div>

        {/* Playhead Line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-red-500 z-10 transition-all duration-75 ease-out"
          style={{
            left: `${(displayTime / duration) * 100}%`,
            transform: 'translateX(-50%)'
          }}
        />

        {/* Current Time Display */}
        <div
          className="absolute top-1 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded font-mono font-medium shadow-lg z-20"
        >
          {formatTime(displayTime)}
        </div>

        {/* Duration Display */}
        <div
          className="absolute top-1 right-2 px-2 py-1 bg-gray-600 text-white text-xs rounded font-mono font-medium shadow-lg z-20"
        >
          {formatTime(duration)}
        </div>

        {/* Time Tooltip during drag */}
        {isDragging && dragTime !== null && (
          <div
            className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-sm rounded shadow-lg z-20"
            style={{
              left: `${(dragTime / duration) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          >
            {formatTime(dragTime)}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineRuler;
