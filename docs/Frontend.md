# AI Video Editor - Frontend Documentation

## Overview

The frontend of the AI Video Editor is built with React and TypeScript, providing a modern, responsive interface for video editing operations. The UI is designed to be intuitive for both beginners and advanced users, with the AI chat interface serving as the primary method of interaction.

## Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── TitleBar
│   └── LayoutContent
├── ProjectList (Home)
└── VideoEditor (Editor Route)
    ├── VideoPlayer
    ├── Timeline
    │   ├── TimelineRuler
    │   ├── TimelineTrack
    │   └── TimelineClip
    └── AIChat
        ├── ChatMessage
        └── CommandSuggestions
```

### State Management

The application uses Zustand for state management, with separate stores for different concerns:

- **ProjectStore**: Manages video projects, tracks, and clips
- **AIChatStore**: Handles AI chat interactions and responses
- **VideoStore**: Manages video playback and preview state

## Core Components

### 1. Layout Component

The main layout wrapper that provides the application structure:

```typescript
interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { currentProject, saveProject } = useProjectStore();

  const handleSave = async () => {
    if (currentProject) {
      await saveProject(currentProject);
    }
  };

  return (
    <div className="layout">
      <TitleBar onSave={handleSave} onBack={() => navigate('/')} />
      <div className="layout-content">
        {children}
      </div>
    </div>
  );
};
```

**Features**:
- **Title Bar**: Application title, project info, and window controls
- **Navigation**: Back button to project list
- **Actions**: Save and export project buttons
- **Window Controls**: Minimize, maximize, close buttons

### 2. ProjectList Component

The home page that displays available projects and allows creation of new ones:

```typescript
const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const { projects, createProject, isLoading } = useProjectStore();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateProject = async (formData: ProjectFormData) => {
    await createProject(formData.name, formData.resolution, formData.fps);
    setShowCreateForm(false);
  };

  return (
    <div className="project-list">
      <Header />
      <ProjectGrid projects={projects} onCreateNew={() => setShowCreateForm(true)} />
      {showCreateForm && <CreateProjectForm onSubmit={handleCreateProject} />}
    </div>
  );
};
```

**Features**:
- **Project Grid**: Visual display of existing projects
- **Create Form**: Modal for creating new projects
- **Project Cards**: Clickable cards with project metadata
- **Responsive Design**: Adapts to different screen sizes

### 3. VideoEditor Component

The main editing interface that combines video preview, timeline, and AI chat:

```typescript
const VideoEditor: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { messages, sendMessage } = useAIChatStore();
  const [currentTime, setCurrentTime] = useState(0);

  const handleAIMessage = async (content: string) => {
    await sendMessage(content, currentProject);
  };

  return (
    <div className="editor-container">
      <div className="editor-main">
        <VideoPlayer project={currentProject} currentTime={currentTime} onTimeUpdate={setCurrentTime} />
        <Timeline project={currentProject} currentTime={currentTime} onTimeUpdate={setCurrentTime} />
      </div>
      <div className="editor-sidebar">
        <AIChat messages={messages} onSendMessage={handleAIMessage} />
      </div>
    </div>
  );
};
```

**Features**:
- **Video Preview**: Real-time preview of edited video
- **Timeline Interface**: Visual representation of video tracks
- **AI Chat**: Natural language command interface
- **Responsive Layout**: Adapts to different screen sizes

## UI Components

### 1. VideoPlayer Component

Handles video playback and preview:

```typescript
interface VideoPlayerProps {
  project: VideoProject | null;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ project, currentTime, onTimeUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const firstVideoClip = project?.tracks.find(t => t.type === 'video')?.clips[0];

  return (
    <div className="video-player">
      <div className="video-container">
        {firstVideoClip ? (
          <video
            ref={videoRef}
            src={firstVideoClip.path}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onTimeUpdate={(e) => onTimeUpdate?.(e.currentTarget.currentTime)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls={false}
          />
        ) : (
          <div className="video-placeholder">
            <p>Import a video to get started</p>
          </div>
        )}
      </div>

      {firstVideoClip && (
        <div className="video-controls">
          <button onClick={() => {
            if (!videoRef.current) return;
            if (isPlaying) videoRef.current.pause(); else videoRef.current.play();
          }}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <input type="range" min={0} max={duration} value={currentTime || 0}
                 onChange={(e) => onTimeUpdate?.(parseFloat(e.target.value))} />
          <input type="range" min={0} max={1} step={0.1} value={volume}
                 onChange={(e) => { setVolume(parseFloat(e.target.value)); if (videoRef.current) videoRef.current.volume = parseFloat(e.target.value); }} />
        </div>
      )}
    </div>
  );
};
```

**Features**:
- **Video Playback**: HTML5 video element with controls
- **Time Tracking**: Current playback position
- **Volume Control**: Audio level adjustment
- **Placeholder State**: UI for when no video is loaded

### 2. Timeline Component

Visual representation of video tracks and clips:

```typescript
interface TimelineProps {
  project: VideoProject | null;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ project, currentTime, onTimeUpdate }) => {
  const { addClipToTrack, removeClipFromTrack, addTrack, removeTrack } = useProjectStore();
  const [zoom, setZoom] = useState(1);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);

  if (!project) return <div className="timeline" />;

  const handleSeek = (time: number) => onTimeUpdate?.(time);

  return (
    <div className="timeline">
      <div className="timeline-header">
        <button onClick={() => setZoom(Math.max(0.1, zoom - 0.2))}>-</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(Math.min(5, zoom + 0.2))}>+</button>
        <button onClick={() => addTrack('Video Track', 'video')}>+ Video</button>
        <button onClick={() => addTrack('Audio Track', 'audio')}>+ Audio</button>
        <button onClick={() => addTrack('Overlay Track', 'overlay')}>+ Overlay</button>
      </div>

      <TimelineRuler currentTime={currentTime || 0} duration={project.duration} zoom={zoom} onSeek={handleSeek} />

      <div className="timeline-tracks">
        {project.tracks.map(track => (
          <TimelineTrackComponent
            key={track.id}
            track={track}
            zoom={zoom}
            onClipDrop={(trackId, clip) => addClipToTrack(trackId, clip)}
            onClipRemove={(trackId, clipId) => removeClipFromTrack(trackId, clipId)}
            onRemoveTrack={removeTrack}
            selectedClip={selectedClip}
            onClipSelect={setSelectedClip}
          />
        ))}
      </div>
    </div>
  );
};
```

**Features**:
- **Track Display**: Visual representation of video and audio tracks
- **Clip Management**: Drag and drop clips between tracks
- **Time Ruler**: Visual time scale with current position indicator
- **Zoom Control**: Adjust timeline zoom level
- **Clip Operations**: Add, remove, and modify clips

### 3. AIChat Component
### 4. TimelineRuler Component

Lightweight time scale with markers and a clickable seek area.

```typescript
interface TimelineRulerProps {
  currentTime: number;
  duration: number;
  zoom: number;
  onSeek: (time: number) => void;
}
```

**Features**:
- Markers auto-calculated by zoom
- Click to seek
- Playhead line and indicator

### 5. TimelineTrack Component

Represents a single track (video/audio/overlay) and its clips.

```typescript
interface TimelineTrackProps {
  track: TimelineTrack;
  zoom: number;
  onClipDrop: (trackId: string, clip: VideoClip) => void;
  onClipRemove: (trackId: string, clipId: string) => void;
  onRemoveTrack: (trackId: string) => void;
  selectedClip: string | null;
  onClipSelect: (clipId: string | null) => void;
}
```

**Features**:
- Drag & drop clips
- Remove track
- Renders `TimelineClip`

### 6. TimelineClip Component

A draggable, selectable clip block with keyboard accessibility.

```typescript
interface TimelineClipProps {
  clip: VideoClip;
  zoom: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}
```

**Features**:
- Position and width based on start/duration
- Enter/Space select, Delete remove
- Resize handles placeholder

### 7. ChatMessage Component

Renders a single chat message with status indicators and optional FFmpeg payload.

```typescript
interface ChatMessageProps {
  message: ChatMessage;
}
```

**Features**:
- Status: pending, processing, completed, error
- User/Assistant avatars and alignment
- Copy FFmpeg operation

### 8. CommandSuggestions Component

Quick-pick commands organized by categories (basic, effects, audio, transform, advanced).

```typescript
interface CommandSuggestionsProps {
  onCommandSelect: (command: string) => void;
}
```

**Features**:
- Category tabs with curated commands
- 1-click inject into chat input
- Tips and examples

Interface for AI-powered video editing commands:

```typescript
interface AIChatProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
}

const AIChat: React.FC<AIChatProps> = ({ messages, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    setIsLoading(true);
    try {
      await onSendMessage(inputValue);
      setInputValue('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-chat">
      <div className="messages">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && <div>AI is thinking…</div>}
      </div>
      <CommandSuggestions onCommandSelect={setInputValue} />
      <div className="input">
        <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
        <button disabled={!inputValue.trim() || isLoading} onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};
```

**Features**:
- **Message History**: Scrollable chat history
- **Input Interface**: Text input with send button
- **Loading States**: Visual feedback during AI processing
- **Command Suggestions**: Quick access to common commands
- **Auto-scroll**: Automatically scroll to latest messages

## State Management

### 1. ProjectStore

Manages video project state and operations:

```typescript
interface ProjectState {
  projects: VideoProject[];
  currentProject: VideoProject | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createProject: (name: string, resolution?: Resolution, fps?: number) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: (project: VideoProject) => Promise<void>;
  addClipToTrack: (trackId: string, clip: VideoClip) => void;
  removeClipFromTrack: (trackId: string, clipId: string) => void;
  updateClip: (trackId: string, clipId: string, updates: Partial<VideoClip>) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // State
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  // Actions
  createProject: async (name, resolution, fps) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/project', { name, resolution, fps });
      const newProject = response.data.project;

      set(state => ({
        projects: [...state.projects, newProject],
        currentProject: newProject,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create project',
        isLoading: false
      });
    }
  },

  // ... other actions
}));
```

**Key Features**:
- **CRUD Operations**: Create, read, update, delete projects
- **Track Management**: Add, remove, and modify tracks
- **Clip Operations**: Manage video and audio clips
- **Error Handling**: Centralized error management
- **Loading States**: Track operation progress

### 2. AIChatStore

Manages AI chat interactions:

```typescript
interface AIChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  aiStatus: 'idle' | 'processing' | 'ready' | 'error';

  // Actions
  sendMessage: (content: string, projectContext?: any) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  getAIStatus: () => Promise<void>;
}

export const useAIChatStore = create<AIChatState>((set, get) => ({
  // State
  messages: [],
  isLoading: false,
  error: null,
  aiStatus: 'idle',

  // Actions
  sendMessage: async (content, projectContext) => {
    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content,
      timestamp: new Date(),
      status: 'pending'
    };

    set(state => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null
    }));

    try {
      const response = await api.post('/api/ai/chat', {
        message: content,
        projectContext
      });

      const aiResponse = response.data.aiResponse;

      const aiMessage: ChatMessage = {
        id: generateId(),
        type: 'assistant',
        content: `I'll help you with that! ${aiResponse.command ? 'Processing your request...' : 'How can I help you further?'}`,
        timestamp: new Date(),
        status: 'completed',
        ffmpegCommand: aiResponse.operation ? JSON.stringify(aiResponse.operation) : undefined
      };

      set(state => ({
        messages: [...state.messages, aiMessage],
        isLoading: false
      }));

      // Update user message status
      if (aiResponse.command) {
        set(state => ({
          messages: state.messages.map(msg =>
            msg.id === userMessage.id
              ? { ...msg, status: 'completed' as const }
              : msg
          )
        }));
      }
    } catch (error) {
      set(state => ({
        messages: state.messages.map(msg =>
          msg.id === userMessage.id
            ? { ...msg, status: 'error' as const }
            : msg
        ),
        error: error instanceof Error ? error.message : 'Failed to send message',
        isLoading: false
      }));
    }
  },

  // ... other actions
}));
```

**Key Features**:
- **Message Management**: Store and display chat messages
- **AI Integration**: Send messages to AI service
- **Status Tracking**: Track message and operation status
- **Error Handling**: Handle AI service failures gracefully
- **Context Awareness**: Include project context in AI requests

## Styling and Design

### 1. Tailwind CSS Integration

The application uses Tailwind CSS for styling:

```typescript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          // ... more shades
        },
        gray: {
          50: '#f8fafc',
          // ... more shades
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      }
    },
  },
  plugins: [],
}
```

### 2. Custom CSS Classes

Application-specific styles are defined in CSS files:

```css
/* index.css */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --background-color: #0f172a;
  --surface-color: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
}

/* App.css */
.layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.title-bar {
  height: 60px;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-bottom: 1px solid #475569;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  -webkit-app-region: drag;
}
```

## Responsive Design

### 1. Breakpoint Strategy

The application uses Tailwind's responsive utilities:

```typescript
// Mobile-first approach
<div className="
  w-full                    // Mobile: full width
  md:w-1/2                 // Medium screens: half width
  lg:w-1/3                 // Large screens: one-third width
  xl:w-1/4                 // Extra large: one-quarter width
">
  {/* Content */}
</div>
```

### 2. Layout Adaptations

Different layouts for different screen sizes:

```typescript
const VideoEditor: React.FC = () => {
  return (
    <div className="
      editor-container
      flex-col                    // Mobile: vertical layout
      lg:flex-row                // Large screens: horizontal layout
    ">
      <div className="
        editor-main
        w-full                    // Mobile: full width
        lg:w-auto                // Large screens: auto width
        lg:flex-1                // Large screens: take remaining space
      ">
        <VideoPlayer />
        <Timeline />
      </div>
      <div className="
        editor-sidebar
        w-full                    // Mobile: full width
        h-80                     // Mobile: fixed height
        lg:w-96                  // Large screens: fixed width
        lg:h-auto                // Large screens: full height
        border-t                  // Mobile: top border
        lg:border-l               // Large screens: left border
        lg:border-t-0             // Large screens: no top border
      ">
        <AIChat />
      </div>
    </div>
  );
};
```

## Performance Optimization

### 1. Component Memoization

Use React.memo for expensive components:

```typescript
const TimelineClip = React.memo<TimelineClipProps>(({ clip, onSelect, onRemove }) => {
  // Component implementation
});

const ChatMessage = React.memo<ChatMessageProps>(({ message }) => {
  // Component implementation
});
```

### 2. Lazy Loading

Load components only when needed:

```typescript
const VideoEditor = lazy(() => import('./components/VideoEditor'));
const ProjectList = lazy(() => import('./components/ProjectList'));

const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/editor/:projectId" element={<VideoEditor />} />
      </Routes>
    </Suspense>
  );
};
```

### 3. Virtual Scrolling

For large timelines, implement virtual scrolling:

```typescript
const VirtualTimeline: React.FC<VirtualTimelineProps> = ({ tracks, height, itemHeight }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(height / itemHeight) + 1,
      tracks.length
    );

    return tracks.slice(startIndex, endIndex).map((track, index) => ({
      ...track,
      index: startIndex + index
    }));
  }, [tracks, scrollTop, height, itemHeight]);

  return (
    <div
      ref={containerRef}
      className="timeline-container"
      style={{ height, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: tracks.length * itemHeight }}>
        {visibleItems.map(track => (
          <TimelineTrack
            key={track.id}
            track={track}
            style={{
              position: 'absolute',
              top: track.index * itemHeight,
              height: itemHeight
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

## Accessibility

### 1. Keyboard Navigation

Support keyboard-only navigation:

```typescript
const TimelineClip: React.FC<TimelineClipProps> = ({ clip, onSelect, onRemove }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(clip);
    } else if (e.key === 'Delete') {
      e.preventDefault();
      onRemove(clip.id);
    }
  };

  return (
    <div
      className="timeline-clip"
      tabIndex={0}
      role="button"
      aria-label={`${clip.name} (${clip.duration}s)`}
      onKeyDown={handleKeyDown}
      onClick={() => onSelect(clip)}
    >
      {clip.name}
    </div>
  );
};
```

### 2. Screen Reader Support

Provide proper ARIA labels and descriptions:

```typescript
const VideoPlayer: React.FC<VideoPlayerProps> = ({ project }) => {
  return (
    <div className="video-player" role="region" aria-label="Video Player">
      <div className="video-container">
        {project?.tracks[0]?.clips[0] ? (
          <video
            src={project.tracks[0].clips[0].path}
            controls
            aria-label={`Playing ${project.tracks[0].clips[0].name}`}
          />
        ) : (
          <div className="video-placeholder" aria-live="polite">
            <p>Import a video to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};
```

## Testing Strategy

### 1. Component Testing

Test individual components in isolation:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoPlayer } from './VideoPlayer';

describe('VideoPlayer', () => {
  it('displays placeholder when no video is loaded', () => {
    render(<VideoPlayer project={null} />);
    expect(screen.getByText('Import a video to get started')).toBeInTheDocument();
  });

  it('plays video when play button is clicked', () => {
    const mockProject = createMockProject();
    render(<VideoPlayer project={mockProject} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    // Assert video is playing
  });
});
```

### 2. Integration Testing

Test component interactions:

```typescript
describe('VideoEditor Integration', () => {
  it('updates timeline when AI command is executed', async () => {
    render(<VideoEditor />);

    const chatInput = screen.getByPlaceholderText('Type your editing command...');
    fireEvent.change(chatInput, { target: { value: 'Trim the first 10 seconds' } });

    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    // Wait for AI response
    await waitFor(() => {
      expect(screen.getByText('Processing your request...')).toBeInTheDocument();
    });

    // Assert timeline is updated
  });
});
```

## Future Enhancements

### 1. Advanced UI Features

- **Drag and Drop**: Visual clip manipulation
- **Multi-select**: Select and modify multiple clips
- **Undo/Redo**: History of editing operations
- **Keyboard Shortcuts**: Power user shortcuts

### 2. Performance Improvements

- **Web Workers**: Offload heavy computations
- **WebAssembly**: Port performance-critical code
- **Service Workers**: Offline capabilities
- **IndexedDB**: Better local storage

### 3. User Experience

- **Tutorial Mode**: Interactive learning experience
- **Custom Themes**: User-defined color schemes
- **Layout Presets**: Save and restore UI layouts
- **Collaboration**: Real-time multi-user editing
