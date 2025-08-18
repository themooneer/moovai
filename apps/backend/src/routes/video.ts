import { Router } from 'express';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import { VideoService } from '../services/videoService';
import { FFmpegService } from '../services/ffmpegService';

const router = Router();
const videoService = new VideoService();
const ffmpegService = new FFmpegService();

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
};

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadsDir();
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname) || '.mp4';
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const supportedTypes = [
      'video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/wmv',
      'video/flv', 'video/webm', 'video/m4v', 'video/3gp', 'video/ogv'
    ];
    
    if (supportedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported video format. Supported formats: ${supportedTypes.map(t => t.replace('video/', '')).join(', ')}`));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Upload video
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No video file provided' 
      });
    }

    console.log(`📹 Processing video upload: ${req.file.originalname} (${req.file.size} bytes)`);

    const videoInfo = await videoService.getVideoInfo(req.file.path);
    const clip = await videoService.createVideoClip(req.file.path, videoInfo);

    console.log(`✅ Video uploaded successfully: ${clip.name} (${clip.duration}s)`);

    res.json({
      success: true,
      clip,
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    console.error('❌ Video upload error:', error);
    
    // Clean up uploaded file if processing failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError);
      }
    }

    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload video' 
    });
  }
});

// Error handling middleware for multer errors
router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 100MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${error.message}`
    });
  }
  
  if (error.message && error.message.includes('Unsupported video format')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  next(error);
});

// Get video info
router.get('/info/:videoId', async (req, res) => {
  try {
    const videoInfo = await videoService.getVideoInfo(req.params.videoId);
    res.json(videoInfo);
  } catch (error) {
    console.error('Get video info error:', error);
    res.status(500).json({ error: 'Failed to get video info' });
  }
});

// Process video with FFmpeg
router.post('/process', async (req, res) => {
  try {
    const { inputPath, outputPath, operations } = req.body;

    const result = await ffmpegService.processVideo(inputPath, outputPath, operations);

    res.json({
      success: true,
      result,
      message: 'Video processed successfully'
    });
  } catch (error) {
    console.error('Video processing error:', error);
    res.status(500).json({ error: 'Failed to process video' });
  }
});

// Get processing progress
router.get('/progress/:operationId', async (req, res) => {
  try {
    const progress = await ffmpegService.getProgress(req.params.operationId);
    res.json({ progress });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

export { router as videoRoutes };
