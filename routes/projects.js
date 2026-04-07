const express = require('express');
const Project = require('../models/Project');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper to format project for frontend (industry_name)
const formatProject = (p) => {
    const obj = p.toObject();
    return {
        ...obj,
        id: obj._id,
        industry_mentor_id: obj.industry_mentor_id?._id || obj.industry_mentor_id,
        faculty_id: obj.faculty_id?._id || obj.faculty_id,
        industry_name: obj.industry_mentor_id?.name
    };
};

// Get all approved projects (for students) or all projects (for admin/faculty)
router.get('/', authenticate, async (req, res) => {
    try {
        let filter = { status: { $ne: 'deleted' } };
        
        if (req.user.role === 'student') {
            filter.status = { $in: ['approved', 'in-progress', 'pending'], $ne: 'deleted' };
        } else if (req.user.role === 'industry') {
            filter.industry_mentor_id = req.user.id;
        }

        const projects = await Project.find(filter).populate('industry_mentor_id', 'name');
        res.json(projects.map(formatProject));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch projects', details: err.message });
    }
});

// Industry mentor posts a new project proposal
router.post('/', authenticate, authorizeRole(['industry']), async (req, res) => {
    const { title, description, duration, skills_required } = req.body;
    try {
        const project = await Project.create({
            title,
            description,
            duration,
            skills_required,
            industry_mentor_id: req.user.id,
            status: 'pending'
        });
        res.status(201).json({ message: 'Project proposal submitted successfully', id: project._id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Faculty approves a project
router.put('/:id/approve', authenticate, authorizeRole(['faculty', 'admin']), async (req, res) => {
    try {
        await Project.findByIdAndUpdate(req.params.id, { 
            status: 'approved', 
            faculty_id: req.user.id 
        });
        res.json({ message: 'Project approved successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve project' });
    }
});

// Update project status (completed, etc)
router.put('/:id/status', authenticate, async (req, res) => {
    const { status } = req.body;
    try {
        await Project.findByIdAndUpdate(req.params.id, { status });
        res.json({ message: 'Project status updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update project status' });
    }
});

// Delete project (Soft delete)
router.delete('/:id', authenticate, authorizeRole(['industry', 'admin']), async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        
        if (req.user.role !== 'admin' && project.industry_mentor_id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You do not have permission to delete this project' });
        }

        project.status = 'deleted';
        await project.save();
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project', details: err.message });
    }
});

module.exports = router;
