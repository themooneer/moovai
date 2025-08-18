import { Router } from 'express';
import { ProjectService } from '../services/projectService';
import { VideoProject, TimelineTrack } from '@ai-video-editor/shared';

const router = Router();
const projectService = new ProjectService();

// Create new project
router.post('/', async (req, res) => {
  try {
    const { name, resolution, fps } = req.body;
    const project = await projectService.createProject(name, resolution, fps);

    res.json({
      success: true,
      project,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get project by ID
router.get('/:projectId', async (req, res) => {
  try {
    const project = await projectService.getProject(req.params.projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Update project
router.put('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;

    const project = await projectService.updateProject(projectId, updates);

    res.json({
      success: true,
      project,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    await projectService.deleteProject(projectId);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Add track to project
router.post('/:projectId/tracks', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, type } = req.body;

    const track = await projectService.addTrack(projectId, name, type);

    res.json({
      success: true,
      track,
      message: 'Track added successfully'
    });
  } catch (error) {
    console.error('Add track error:', error);
    res.status(500).json({ error: 'Failed to add track' });
  }
});

// Remove track from project
router.delete('/:projectId/tracks/:trackId', async (req, res) => {
  try {
    const { projectId, trackId } = req.params;
    await projectService.removeTrack(projectId, trackId);

    res.json({
      success: true,
      message: 'Track removed successfully'
    });
  } catch (error) {
    console.error('Remove track error:', error);
    res.status(500).json({ error: 'Failed to remove track' });
  }
});

// Export project
router.post('/:projectId/export', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { outputPath, format } = req.body;

    const result = await projectService.exportProject(projectId, outputPath, format);

    res.json({
      success: true,
      result,
      message: 'Project exported successfully'
    });
  } catch (error) {
    console.error('Export project error:', error);
    res.status(500).json({ error: 'Failed to export project' });
  }
});

export { router as projectRoutes };
