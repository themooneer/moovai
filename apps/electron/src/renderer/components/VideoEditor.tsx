import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useAIChatStore } from '../stores/aiChatStore';
import { videoImportService, VideoImportResult } from '../services/videoImportService';
import VideoPlayer from './VideoPlayer';
import Timeline from './Timeline';
import AIChat from './AIChat';
import { VideoClip } from '../types';

const VideoEditor: React.FC = () => {
  const { currentProject, saveProject, addClipToTrack, createProject, setCurrentProject } = useProjectStore();
  const { messages, sendMessage, processingVideo } = useAIChatStore();
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isTopBarCollapsed, setIsTopBarCollapsed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAIChatExpanded, setIsAIChatExpanded] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const cleanupDragAndDropRef = useRef<(() => void) | null>(null);
  const [pendingClip, setPendingClip] = useState<VideoClip | null>(null);

  // No need for complex AI video handling - backend handles file renaming
  // Video player will automatically reload when the file changes

  const handleAIMessage = async (content: string) => {
    // Extract video tracks and their clips for AI processing
    let projectContext = null;

    if (currentProject) {
      const videoTracks = currentProject.tracks.filter(track => track.type === 'video');
      if (videoTracks.length > 0 && videoTracks[0].clips.length > 0) {
        // Get the latest video clip from the first video track
        const latestClip = videoTracks[0].clips[videoTracks[0].clips.length - 1];

        projectContext = {
          videoTracks: [{
            path: latestClip.path,
            filePath: latestClip.path,
            name: latestClip.name,
            duration: latestClip.duration
          }]
        };

        console.log('🎬 Sending AI message with video context:', projectContext);
      } else {
        console.log('⚠️ No video clips found in project for AI processing');
      }
    }

    await sendMessage(content, projectContext);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleVideoDurationUpdate = (duration: number) => {
    setVideoDuration(duration);
  };

  const handleSaveProject = async () => {
    if (currentProject) {
      await saveProject(currentProject);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    // TODO: Implement export functionality
    setTimeout(() => setIsExporting(false), 2000);
  };

  const handleVideoImport = async () => {
    setIsImporting(true);
    setImportError(null);

    try {
      console.log('🎬 Starting video import...');

      const result = await videoImportService.processVideoFile(
        await getVideoFileFromPicker()
      );

      console.log('🎬 Video import result:', result);

      if (result.success && result.clip) {
        console.log('🎬 Video import successful, adding to project...');
        await handleVideoImportSuccess(result.clip);
      } else {
        console.error('🎬 Video import failed:', result.error);
        setImportError(result.error || 'Failed to import video');
      }
    } catch (error) {
      console.error('🎬 Video import error:', error);
      setImportError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const getVideoFileFromPicker = (): Promise<File> => {
    return new Promise((resolve, reject) => {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.multiple = false;

        input.onchange = (event) => {
          try {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];

            if (file) {
              console.log('🎬 File selected:', file.name, file.type, file.size);
              resolve(file);
            } else {
              reject(new Error('No file selected'));
            }
          } catch (error) {
            console.error('🎬 Error in file picker change handler:', error);
            reject(error);
          }
        };

        input.onerror = (error) => {
          console.error('🎬 File picker error:', error);
          reject(new Error('File picker failed'));
        };

        input.click();
      } catch (error) {
        console.error('🎬 Error creating file picker:', error);
        reject(error);
      }
    });
  };

  const handleVideoImportSuccess = async (clip: VideoClip) => {
    try {
      console.log('🎬 Handling video import success for clip:', clip);

      // Create project if none exists
      if (!currentProject) {
        console.log('🔄 No project exists, creating new project...');
        await createProject('Untitled Project', { width: 1920, height: 1080 }, 30);
        console.log('✅ Project creation completed, setting pending clip...');
        // Store the clip to add after project creation
        setPendingClip(clip);
      } else {
        console.log('📁 Project exists, adding clip to existing project...');

        try {
          // Add video clip to existing project
          const videoTrack = currentProject.tracks.find(track => track.type === 'video');
          if (videoTrack) {
            console.log('🎬 Adding clip to existing video track:', videoTrack.id);
            addClipToTrack(videoTrack.id, clip);
          } else {
            console.log('🎬 Creating new video track for clip');
            // Create video track if none exists
            addClipToTrack('default', clip);
          }

          console.log('✅ Video clip added to project successfully');
        } catch (trackError) {
          console.error('🎬 Error adding clip to project:', trackError);
          throw new Error(`Failed to add video to project: ${trackError instanceof Error ? trackError.message : 'Unknown error'}`);
        }
      }

      // Extract metadata for AI usage
      try {
        console.log('🎬 Extracting video metadata for AI...');
        const metadata = await videoImportService.extractVideoMetadata(clip);
        console.log('✅ Video metadata extracted for AI:', metadata);
      } catch (metadataError) {
        console.warn('⚠️ Failed to extract video metadata, but continuing:', metadataError);
        // Don't fail the import if metadata extraction fails
      }

    } catch (error) {
      console.error('❌ Error handling video import success:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to add video to project');
      throw error; // Re-throw to be caught by the main handler
    }
  };

  // Setup drag and drop when component mounts
  useEffect(() => {
    if (videoContainerRef.current) {
      cleanupDragAndDropRef.current = videoImportService.setupDragAndDrop(
        videoContainerRef.current,
        handleVideoDropWithProgress,
        (event) => {
          // Handle drag over
          event.preventDefault();
        },
        (event) => {
          // Handle drag leave
          event.preventDefault();
        }
      );
    }

    return () => {
      if (cleanupDragAndDropRef.current) {
        cleanupDragAndDropRef.current();
      }
    };
  }, []);

  // Enhanced drag and drop with progress tracking
  const handleVideoDropWithProgress = async (file: File) => {
    setIsImporting(true);
    setImportError(null);

    try {
      const result = await videoImportService.processVideoFile(
        file
      );

      if (result.success && result.clip) {
        await handleVideoImportSuccess(result.clip);
      } else {
        setImportError(result.error || 'Failed to import dropped video');
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  // Effect to add pending clip after project creation
  useEffect(() => {
    if (pendingClip && currentProject) {
      const handlePendingClip = async () => {
        try {
          console.log('🎬 Adding pending clip to newly created project...');

          // Add the clip to the project
          addClipToTrack('default', pendingClip);

          // Clear pending clip after successful addition
          setPendingClip(null);

          console.log('✅ Project created and video clip added successfully');
        } catch (error) {
          console.error('❌ Failed to add pending clip to project:', error);
          setImportError('Failed to add video clip to project');
        }
      };

      handlePendingClip();
    }
  }, [currentProject, pendingClip, addClipToTrack]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 text-gray-500 opacity-50">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-100 mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            No Project Loaded
          </h2>
          <p className="text-gray-400 text-lg">Please select a project to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-editor h-full flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* AI Processing Notification */}
      {/* This section was removed as per the edit hint. */}

      {/* Top Bar */}
      <div className={`top-bar bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm border-b border-white/10 transition-all duration-300 ${
        isTopBarCollapsed ? 'h-16' : 'h-24'
      }`}>
        <div className="flex items-center justify-between px-6 h-full">
          {/* Left Side - Project Info & Timeline Toggle */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setIsTopBarCollapsed(!isTopBarCollapsed)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 hover:scale-105"
            >
              <svg className={`w-5 h-5 text-gray-300 transition-transform duration-300 ${
                isTopBarCollapsed ? 'rotate-180' : ''
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                AI Video Editor
              </h1>

              {/* Project Info */}
              {currentProject && (
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-semibold text-white">{currentProject.name}</h2>
                  <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium">
                    {currentProject.resolution.width}×{currentProject.resolution.height}
                  </div>
                  <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium">
                    {currentProject.fps} FPS
                  </div>
                </div>
              )}

              {/* AI Processing Status Indicator */}
              {processingVideo && (
                <div className="flex items-center space-x-3 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-300 font-medium">AI Processing Video</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSaveProject}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
            >
              Save Project
            </button>

            {/* Debug button - only show in development */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => {
                  console.log('🎬 Debug: Current project state:', currentProject);
                  if (currentProject) {
                    const videoTracks = currentProject.tracks.filter(track => track.type === 'video');
                    console.log('🎬 Debug: Video tracks:', videoTracks);
                    videoTracks.forEach(track => {
                      console.log('🎬 Debug: Track clips:', track.clips);
                    });
                  }
                }}
                className="px-4 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105"
              >
                Debug
              </button>
            )}

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Exporting...</span>
                </div>
              ) : (
                'Export Video'
              )}
            </button>
          </div>
        </div>

        {/* Timeline Preview - Hidden when collapsed */}
        {!isTopBarCollapsed && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center h-16 bg-gray-800/30 rounded-xl border border-white/10">
              <button
                onClick={handleVideoImport}
                disabled={isImporting}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Import Video</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Success Notification */}
      {/* This section was removed as per the edit hint. */}

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
        {/* Video Player Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col">
            <VideoPlayer
              project={currentProject}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
              onVideoDurationUpdate={setVideoDuration}
            />

            {/* Import Button - Only show when no video is loaded */}
            {!currentProject.tracks.some(track => track.type === 'video' && track.clips.length > 0) && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleVideoImport}
                  disabled={isImporting}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
                >
                  {isImporting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Importing Video...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Import Your First Video</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Error Display */}
            {importError && (
              <div className="mt-4 mx-auto max-w-md bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{importError}</span>
                  <button
                    onClick={() => setImportError(null)}
                    className="ml-auto text-red-400 hover:text-red-300"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Chat Section */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <AIChat
            messages={messages}
            onSendMessage={handleAIMessage}
            expanded={true}
            onToggle={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;