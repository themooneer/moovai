import { Router } from 'express';
import multer from 'multer';
import { VideoService } from '../services/videoService';
import { FFmpegService } from '../services/ffmpegService';

const router = Router();
const videoService = new VideoService();
const ffmpegService = new FFmpegService();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.mp4');
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
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
      return res.status(400).json({ error: 'No video file provided' });
    }

    const videoInfo = await videoService.getVideoInfo(req.file.path);
    const clip = await videoService.createVideoClip(req.file.path, videoInfo);

    res.json({
      success: true,
      clip,
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
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
