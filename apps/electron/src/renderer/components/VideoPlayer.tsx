import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useAIChatStore } from '../stores/aiChatStore';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  onTimeUpdate?: (time: number) => void;
  onVideoDurationUpdate?: (duration: number) => void;
  currentTime?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  onTimeUpdate,
  onVideoDurationUpdate,
  currentTime
}) => {
  // Player refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  // Project and AI chat state
  const project = useProjectStore(state => state.currentProject);
  const { processingVideo } = useAIChatStore();

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the latest video clip
  const videoTracks = project?.tracks.filter(track => track.type === 'video') || [];
  const videoClip = videoTracks.length > 0
    ? videoTracks[0].clips[videoTracks[0].clips.length - 1]
    : null;

  // Utility function to construct video URLs with proper cache busting
  const getVideoUrl = useCallback((path: string): string => {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Use the static file serving endpoint from the backend with cache busting
    const backendUrl = 'http://localhost:3001';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    return `${backendUrl}/${path}?t=${timestamp}&r=${randomId}`;
  }, []);

  // Simple Video.js implementation
  useEffect(() => {
    if (!videoClip?.path || !videoRef.current) return;

    console.log('🎬 VideoPlayer: Setting up Video.js player for:', videoClip.path);

    // Clean up any existing player instance
    if (playerRef.current) {
      try {
        console.log('🎬 VideoPlayer: Disposing existing Video.js instance');
        playerRef.current.dispose();
        playerRef.current = null;
      } catch (error) {
        console.warn('🎬 VideoPlayer: Error disposing Video.js:', error);
      }
    }

    // Reset states
    setIsLoadingVideo(true);
    setError(null);
    setCurrentVideoTime(0);
    setDuration(0);
    setIsPlaying(false);

    // Initialize Video.js
    const initPlayer = () => {
      try {
        console.log('🎬 VideoPlayer: Creating Video.js instance');

        playerRef.current = videojs(videoRef.current!, {
          controls: true,
          fluid: true,
          responsive: true,
          preload: 'metadata',
          autoplay: false,
          muted: false,
          volume: volume,
          sources: [{
            src: getVideoUrl(videoClip.path),
            type: 'video/mp4'
          }]
        });

        // Video.js event listeners
        playerRef.current.ready(() => {
          console.log('🎬 VideoPlayer: Video.js ready');
          setIsLoadingVideo(false);
          setError(null);
        });

        playerRef.current.on('loadedmetadata', () => {
          console.log('🎬 VideoPlayer: Metadata loaded, duration:', playerRef.current.duration());
          const videoDuration = playerRef.current.duration();
          if (videoDuration && !isNaN(videoDuration)) {
            setDuration(videoDuration);
            onVideoDurationUpdate?.(videoDuration);
          }
          setIsLoadingVideo(false);
        });

        playerRef.current.on('timeupdate', () => {
          const currentTime = playerRef.current.currentTime();
          if (currentTime !== undefined && !isNaN(currentTime)) {
            setCurrentVideoTime(currentTime);
            onTimeUpdate?.(currentTime);
          }
        });

        playerRef.current.on('play', () => {
          console.log('🎬 VideoPlayer: Play event');
          setIsPlaying(true);
        });

        playerRef.current.on('pause', () => {
          console.log('🎬 VideoPlayer: Pause event');
          setIsPlaying(false);
        });

        playerRef.current.on('ended', () => {
          console.log('🎬 VideoPlayer: Ended event');
          setIsPlaying(false);
        });

        playerRef.current.on('error', () => {
          console.error('🎬 VideoPlayer: Video.js error');
          setError('Video playback error');
          setIsLoadingVideo(false);
        });

      } catch (error) {
        console.error('🎬 VideoPlayer: Error creating Video.js:', error);
        setError('Failed to initialize video player');
        setIsLoadingVideo(false);
      }
    };

    // Initialize with a small delay to ensure DOM is ready
    const timer = setTimeout(initPlayer, 100);

    return () => {
      clearTimeout(timer);
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
          playerRef.current = null;
        } catch (error) {
          console.warn('🎬 VideoPlayer: Error disposing Video.js:', error);
        }
      }
    };
  }, [videoClip?.path, volume, onVideoDurationUpdate, onTimeUpdate, getVideoUrl]);

  // Volume sync
  useEffect(() => {
    if (playerRef.current && playerRef.current.volume) {
      playerRef.current.volume(volume);
    }
  }, [volume]);

  // Update external time changes
  useEffect(() => {
    if (currentTime !== undefined && Math.abs(currentTime - currentVideoTime) > 0.1) {
      if (playerRef.current && playerRef.current.currentTime) {
        playerRef.current.currentTime(currentTime);
      }
      setCurrentVideoTime(currentTime);
      onTimeUpdate?.(currentTime);
    }
  }, [currentTime, currentVideoTime, onTimeUpdate]);

  return (
    <div className="video-player bg-transparent rounded-2xl overflow-hidden">
      <div className="video-container relative">
        {videoClip ? (
          <div className="relative">
            {/* Video element for Video.js */}
            <div
              key={`video-container-${videoClip.path}`}
              className="w-full h-auto rounded-xl shadow-2xl bg-black"
              style={{
                minHeight: '300px',
                maxHeight: '70vh'
              }}
            >
              {/* Video element for Video.js */}
              <video
                ref={videoRef}
                className="video-js vjs-default-skin"
                controls
                preload="metadata"
                width="100%"
                height="auto"
                data-setup="{}"
                style={{
                  width: '100%',
                  height: 'auto',
                  minHeight: '300px',
                  maxHeight: '70vh'
                }}
              />
            </div>

            {/* Loading indicator */}
            {isLoadingVideo && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-sm rounded-xl">
                <div className="bg-black/70 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>
                    {processingVideo
                      ? 'AI Processing Video...'
                      : 'Loading video...'
                    }
                  </span>
                </div>
              </div>
            )}

            {/* AI Processing indicator */}
            {processingVideo && !isLoadingVideo && (
              <div className="absolute inset-0 bg-blue-900/30 flex items-center justify-center backdrop-blur-sm rounded-xl">
                <div className="bg-blue-900/90 text-white px-6 py-4 rounded-lg flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">AI Processing Video</div>
                    <div className="text-sm opacity-80">Please wait while we process your request...</div>
                  </div>
                </div>
              </div>
            )}

            {/* Error indicator */}
            {error && (
              <div className="absolute inset-0 bg-red-900/30 flex items-center justify-center backdrop-blur-sm rounded-xl">
                <div className="bg-red-900/90 text-white px-4 py-2 rounded-lg flex flex-col items-center space-y-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-center">
                    <div className="font-semibold">Video Error</div>
                    <div className="text-sm opacity-80">{error}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        console.log('🎬 VideoPlayer: Retry requested');
                        setError(null);
                      }}
                      className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Video info overlay */}
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">
              {videoClip.name}
            </div>

            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-xs backdrop-blur-sm">
                <div>Player: Video.js</div>
                <div>Duration: {duration.toFixed(2)}s</div>
                <div>Current Time: {currentVideoTime.toFixed(2)}s</div>
                <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
                <div>Loading: {isLoadingVideo ? 'Yes' : 'No'}</div>
                <div>Processing: {processingVideo ? 'Yes' : 'No'}</div>
                <div>Current Path: {videoClip?.path || 'None'}</div>
                <div className="mt-2 text-xs opacity-70">
                  Using Video.js with native controls
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="video-placeholder flex items-center justify-center h-96 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border-2 border-dashed border-gray-600/50 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/50 hover:bg-gray-800/70">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 text-gray-500/60">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">Import a Video</h3>
              <p className="text-gray-500 text-sm mb-4">Drag and drop a video file or use the AI chat to import</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Supported formats: MP4, AVI, MOV, MKV, WMV, FLV, WebM</p>
                <p>Maximum size: 100MB</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;