import React, { useState, useRef, useEffect } from 'react';
import { VideoProject } from '../types';

// Utility function to construct full video URL
const getVideoUrl = (path: string): string => {
  // If path already has http/https, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Construct full URL from backend server
  return `http://localhost:3001/${path}`;
};

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

  const handleTimeUpdate = () => {
    if (videoRef.current && onTimeUpdate) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      onTimeUpdate?.(time);
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

  const firstVideoClip = project?.tracks.find(track => track.type === 'video')?.clips[0];

  return (
    <div className="video-player bg-transparent rounded-2xl overflow-hidden">
      <div className="video-container relative">
        {firstVideoClip ? (
          <video
            ref={videoRef}
            src={getVideoUrl(firstVideoClip.path)}
            className="w-full h-auto max-h-[70vh] rounded-xl shadow-2xl"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
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

      {firstVideoClip && (
        <div className="video-controls mt-6 p-6 bg-black/20 rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center space-x-6">
            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Time Display and Progress Bar */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span className="font-mono">{formatTime(currentTime || 0)}</span>
                <span className="text-gray-500">/</span>
                <span className="font-mono">{formatTime(duration)}</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime || 0}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-700/50 rounded-xl appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((currentTime || 0) / (duration || 1)) * 100}%, #4b5563 ${((currentTime || 0) / (duration || 1)) * 100}%, #4b5563 100%)`
                  }}
                />
                <div className="absolute top-0 left-0 h-3 bg-blue-500 rounded-xl transition-all duration-100 ease-out"
                     style={{ width: `${((currentTime || 0) / (duration || 1)) * 100}%` }}>
                </div>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.784L4.5 13.5H2a1 1 0 01-1-1v-5a1 1 0 011-1h2.5l3.883-3.284A1 1 0 019.383 3.076zM12.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-4.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm3.536 1.05a1 1 0 011.414 0A6.973 6.973 0 0121 10a6.973 6.973 0 01-3.536 6.021 1 1 0 01-1.414-1.414A4.973 4.973 0 0019 10c0-1.38-.56-2.63-1.464-3.536a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
