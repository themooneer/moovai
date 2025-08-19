# Frontend Documentation

## Overview

The frontend is built with React and TypeScript, providing a modern and responsive user interface for the AI Video Editor. It features a component-based architecture with state management using Zustand.

## Key Features

- **Video Player**: Native HTML5 video player with custom controls
- **Timeline Interface**: Video-focused timeline with perfect duration synchronization
- **AI Chat**: Natural language command interface
- **Responsive Layout**: Adapts to different screen sizes

## UI Components

### 1. VideoPlayer Component

Handles video playback and preview with native HTML5 video:

```typescript
interface VideoPlayerProps {
  project: VideoProject | null;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  onVideoDurationUpdate?: (duration: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ project, currentTime, onTimeUpdate, onVideoDurationUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);

  const firstVideoClip = project?.tracks.find(track => track.type === 'video')?.clips[0];

  return (
    <div className="video-player">
      <div className="video-container">
        {firstVideoClip ? (
          <video
            ref={videoRef}
            src={getVideoUrl(firstVideoClip.path)}
            preload="metadata"
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              if (video.duration) {
                setDuration(video.duration);
                onVideoDurationUpdate?.(video.duration);
              }
            }}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <div className="video-placeholder">
            <p>Import a video to get started</p>
          </div>
        )}
      </div>

      {/* Custom video controls */}
      {firstVideoClip && (
        <div className="video-controls">
          {/* Play/Pause, seek, volume controls */}
        </div>
      )}
    </div>
  );
};
```

**Key Features:**
- Native HTML5 video element for maximum compatibility
- Real-time duration updates passed to parent component
- Custom video controls with play/pause, seek, and volume
- Keyboard shortcuts for precise control
- Visual feedback during seeking operations

**Keyboard Shortcuts:**
- `Space` - Play/Pause
- `←` - Seek 5 seconds backward
- `→` - Seek 5 seconds forward
- `Home` - Jump to start
- `End` - Jump to end

### 2. Timeline Component

Video-focused timeline with perfect duration synchronization:

```typescript
interface TimelineProps {
  project: VideoProject | null;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  compact?: boolean;
  videoDuration?: number;
  onVideoDurationUpdate?: (duration: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ project, currentTime, onTimeUpdate, compact = false, videoDuration, onVideoDurationUpdate }) => {
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

  return (
    <div className="timeline bg-gray-800 rounded-lg overflow-hidden">
      {/* Timeline Header with Zoom Controls */}
      <div className="timeline-header bg-gray-700 px-4 py-2 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-white font-medium">Video Timeline</h3>
            <div className="flex items-center space-x-2">
              {/* Zoom controls */}
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

      {/* Video Tracks Only */}
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
    </div>
  );
};
```

**Key Features:**
- **Video-Only Tracks**: Only displays video tracks for a clean, focused interface
- **Perfect Duration Sync**: Uses actual video duration from HTML5 video element
- **Auto-Scrolling**: Automatically scrolls to keep current time visible
- **Smart Scaling**: Timeline width automatically adjusts to video duration
- **Zoom Integration**: Zoom controls work seamlessly with video duration scaling

### 3. TimelineRuler Component

Advanced timeline ruler with adaptive scaling and precise navigation:

```typescript
interface TimelineRulerProps {
  currentTime: number;
  duration: number;
  zoom: number;
  onSeek: (time: number) => void;
  compact?: boolean;
}

const TimelineRuler: React.FC<TimelineRulerProps> = ({ currentTime, duration, zoom, onSeek, compact = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);

  // Calculate time from mouse position
  const getTimeFromPosition = (clientX: number): number => {
    if (!rulerRef.current) return 0;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const rulerWidth = rect.width;
    const clickTime = (clickX / rulerWidth) * duration;
    return Math.max(0, Math.min(duration, clickTime));
  };

  // Adaptive time markers based on duration and zoom
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
        <div className="absolute top-1 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded font-mono font-medium shadow-lg z-20">
          {formatTime(displayTime)}
        </div>

        {/* Duration Display */}
        <div className="absolute top-1 right-2 px-2 py-1 bg-gray-600 text-white text-xs rounded font-mono font-medium shadow-lg z-20">
          {formatTime(duration)}
        </div>
      </div>
    </div>
  );
};
```

**Key Features:**
- **Adaptive Time Markers**: Automatically adjusts marker density based on video length
- **Drag Navigation**: Click and drag for precise timeline navigation
- **Visual Feedback**: Prominent current time and duration displays
- **Smooth Transitions**: All interactions have smooth CSS transitions
- **Precise Seeking**: Accurate time calculation from mouse position

## Timeline Synchronization Architecture

### 1. Duration Flow

```
VideoPlayer → VideoEditor → Timeline → TimelineRuler
     ↓              ↓          ↓           ↓
onVideoDurationUpdate → videoDuration → effectiveDuration → duration
```

### 2. Time Update Flow

```
VideoPlayer → VideoEditor → Timeline → TimelineRuler
     ↓              ↓          ↓           ↓
onTimeUpdate → currentTime → currentTime → currentTime
```

### 3. Auto-Scrolling Logic

```typescript
// Calculate scroll position to center current time
const timelineWidth = timelineRef.current.offsetWidth;
const totalWidth = Math.max(800, effectiveDuration * 100 * zoom);
const currentTimePosition = (currentTime / effectiveDuration) * totalWidth;
const scrollPosition = currentTimePosition - (timelineWidth / 2);

// Smooth scroll to keep current time centered
tracksContainerRef.current.scrollTo({
  left: Math.max(0, scrollPosition),
  behavior: 'smooth'
});
```

## CSS Styling

### Timeline Styles

```css
/* Timeline Styles */
.timeline {
  transition: transform 0.15s ease-out;
}

.timeline-ruler {
  transition: all 0.15s ease-out;
}

.timeline-tracks {
  scroll-behavior: smooth;
}

.timeline-tracks::-webkit-scrollbar {
  height: 8px;
}

.timeline-tracks::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.timeline-tracks::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.timeline-tracks::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
```

### Video Player Controls

```css
/* Video Player Controls */
.video-controls {
  transition: all 0.2s ease-out;
}

.slider {
  transition: all 0.1s ease-out;
}

.slider:hover {
  transform: scaleY(1.2);
}

/* Smooth transitions for all interactive elements */
button, input, .video-player, .timeline {
  transition: all 0.15s ease-out;
}
```

## Performance Optimization

### 1. Component Memoization

Use React.memo for expensive components:

```typescript
const TimelineClip = React.memo<TimelineClipProps>(({ clip, onSelect, onRemove }) => {
  // Component implementation
});

const TimelineRuler = React.memo<TimelineRulerProps>(({ currentTime, duration, zoom, onSeek }) => {
  // Component implementation
});
```

### 2. Efficient Re-renders

- Timeline only re-renders when `currentTime`, `zoom`, or `effectiveDuration` changes
- VideoPlayer only re-renders when video state changes
- TimelineRuler uses memoization for expensive calculations

### 3. Smooth Animations

- CSS transitions for smooth timeline interactions
- RequestAnimationFrame for smooth scrolling
- Debounced zoom and seek operations

## Testing Strategy

### 1. Component Testing

Test individual components in isolation:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Timeline } from './Timeline';

describe('Timeline', () => {
  it('displays video tracks only', () => {
    const mockProject = createMockProjectWithVideoTracks();
    render(<Timeline project={mockProject} />);

    expect(screen.getByText('Video Timeline')).toBeInTheDocument();
    expect(screen.queryByText('Audio Track')).not.toBeInTheDocument();
  });

  it('synchronizes with video duration', () => {
    const mockProject = createMockProject();
    const { rerender } = render(<Timeline project={mockProject} videoDuration={120} />);

    expect(screen.getByText('Duration: 2:00')).toBeInTheDocument();
  });
});
```

### 2. Integration Testing

Test component interactions:

```typescript
describe('Timeline Integration', () => {
  it('updates video player when timeline is clicked', () => {
    const mockOnTimeUpdate = jest.fn();
    render(
      <VideoEditor>
        <Timeline onTimeUpdate={mockOnTimeUpdate} />
      </VideoEditor>
    );

    const timeline = screen.getByRole('button', { name: /timeline/i });
    fireEvent.click(timeline);

    expect(mockOnTimeUpdate).toHaveBeenCalled();
  });
});
```

## Accessibility

### 1. ARIA Labels

```typescript
const Timeline: React.FC<TimelineProps> = ({ project, currentTime, onTimeUpdate }) => {
  return (
    <div className="timeline" role="region" aria-label="Video Timeline">
      <div className="timeline-ruler" role="slider" aria-valuenow={currentTime} aria-valuemin={0} aria-valuemax={duration}>
        {/* Timeline content */}
      </div>
    </div>
  );
};
```

### 2. Keyboard Navigation

- Tab navigation through timeline controls
- Arrow keys for precise seeking
- Spacebar for play/pause
- Home/End for jump to start/end

### 3. Screen Reader Support

- Proper heading hierarchy
- Descriptive labels for interactive elements
- Time announcements during seeking operations

## Future Enhancements

### 1. Multi-Track Support

- Audio track synchronization
- Overlay track management
- Track mixing and effects

### 2. Advanced Timeline Features

- In/out points for clips
- Speed controls and time stretching
- Frame-accurate seeking
- Snap-to-grid functionality

### 3. Performance Improvements

- Virtual scrolling for long timelines
- WebGL rendering for complex effects
- Worker threads for heavy computations
- Lazy loading of timeline segments

## Troubleshooting

### Common Issues

1. **Timeline not syncing with video**
   - Check that `onVideoDurationUpdate` is being called
   - Verify `videoDuration` is being passed correctly
   - Ensure video metadata is loaded

2. **Timeline not scrolling to current time**
   - Check that `currentTime` is being updated
   - Verify timeline refs are properly set
   - Ensure `effectiveDuration` is calculated correctly

3. **Performance issues with long videos**
   - Reduce zoom level for better performance
   - Check for unnecessary re-renders
   - Consider implementing virtual scrolling

### Debug Tools

```typescript
// Enable debug logging
const DEBUG_TIMELINE = true;

if (DEBUG_TIMELINE) {
  console.log('Timeline: Duration update:', { videoDuration, projectDuration, effectiveDuration });
  console.log('Timeline: Current time:', currentTime);
  console.log('Timeline: Zoom level:', zoom);
}
```

This documentation covers the latest timeline synchronization improvements and provides a comprehensive guide for developers working with the video timeline system.
