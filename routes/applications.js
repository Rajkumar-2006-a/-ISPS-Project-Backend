const express = require('express');
const Application = require('../models/Application');
const Project = require('../models/Project');
const ProgressLog = require('../models/ProgressLog');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper to format application for frontend
const formatApp = (a) => {
    const obj = a.toObject();
    return {
        ...obj,
        id: obj._id,
        project_id: obj.project_id?._id || obj.project_id,
        student_id: obj.student_id?._id || obj.student_id,
        project_title: obj.project_id?.title,
        project_status: obj.project_id?.status,
        industry_mentor_id: obj.project_id?.industry_mentor_id,
        faculty_id: obj.project_id?.faculty_id,
        student_name: obj.student_id?.name,
        student_email: obj.student_id?.email
    };
};

// Student applies for a project
router.post('/apply', authenticate, authorizeRole(['student']), async (req, res) => {
    const { project_id } = req.body;
    try {
        const project = await Project.findById(project_id);
        if (!project || !['approved', 'pending', 'in-progress'].includes(project.status)) {
            return res.status(400).json({ error: 'Project not available for application' });
        }

        const existing = await Application.findOne({ student_id: req.user.id, project_id });
        if (existing) {
            return res.status(400).json({ error: 'Already applied for this project' });
        }

        const app = await Application.create({
            student_id: req.user.id,
            project_id,
            status: 'applied'
        });
        res.status(201).json({ message: 'Successfully applied to project', id: app._id });
    } catch (err) {
        res.status(500).json({ error: 'Application failed' });
    }
});

// View applications contextually
router.get('/', authenticate, async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'student') {
            filter.student_id = req.user.id;
        } else if (req.user.role === 'industry') {
            // This is trickier in Mongo without a join, but we can find projects by this mentor first
            const mentorProjects = await Project.find({ industry_mentor_id: req.user.id }).select('_id');
            filter.project_id = { $in: mentorProjects.map(p => p._id) };
        }

        const apps = await Application.find(filter)
            .populate('project_id')
            .populate('student_id', 'name email');
            
        // Filter out apps where project is deleted
        const activeApps = apps.filter(a => a.project_id && a.project_id.status !== 'deleted');
        
        res.json(activeApps.map(formatApp));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// Update progress percentage and URL
router.put('/:id/status-update', authenticate, authorizeRole(['student']), async (req, res) => {
    const { progress_percent, project_url } = req.body;
    try {
        const app = await Application.findOneAndUpdate(
            { _id: req.params.id, student_id: req.user.id, status: 'selected' },
            { progress_percent, project_url },
            { new: true }
        );
        if (!app) return res.status(403).json({ error: 'You are not assigned to this project' });
        res.json({ message: 'Progress updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update progress status' });
    }
});

// Select a student for project (Industry finalizes)
router.put('/:id/select', authenticate, authorizeRole(['industry', 'admin']), async (req, res) => {
    try {
        const app = await Application.findById(req.params.id);
        if (!app || app.status !== 'faculty_approved') {
            return res.status(400).json({ error: 'Student must be approved by faculty first' });
        }

        app.status = 'selected';
        await app.save();
        
        await Project.findByIdAndUpdate(app.project_id, { status: 'in-progress' });

        res.json({ message: 'Student selected successfully, Project is now In-Progress' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to select student' });
    }
});

// Faculty approves a student application
router.put('/:id/faculty-approve', authenticate, authorizeRole(['faculty', 'admin']), async (req, res) => {
    try {
        const app = await Application.findById(req.params.id);
        if (!app) return res.status(404).json({ error: 'Application not found' });

        app.status = 'faculty_approved';
        await app.save();
        
        await Project.findOneAndUpdate(
            { _id: app.project_id, faculty_id: null },
            { faculty_id: req.user.id }
        );

        res.json({ message: 'Student application approved by faculty' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve application', details: err.message });
    }
});

// Submit progress log entry (Student)
router.post('/:id/progress', authenticate, authorizeRole(['student']), async (req, res) => {
    const { update_text } = req.body;
    try {
        const app = await Application.findOne({ _id: req.params.id, student_id: req.user.id, status: 'selected' });
        if (!app) return res.status(403).json({ error: 'You are not assigned to this project' });

        await ProgressLog.create({ application_id: req.params.id, update_text });
        res.status(201).json({ message: 'Progress update recorded' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Get progress logs for an application
router.get('/:id/progress', authenticate, async (req, res) => {
    try {
        const logs = await ProgressLog.find({ application_id: req.params.id }).sort({ created_at: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch progress logs' });
    }
});

// Evaluate (Mentor/Faculty)
router.post('/:id/evaluate', authenticate, authorizeRole(['industry', 'faculty']), async (req, res) => {
    const { marks, feedback } = req.body;
    try {
        await Application.findByIdAndUpdate(req.params.id, { marks, feedback });
        res.json({ message: 'Evaluation submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Evaluation failed' });
    }
});

module.exports = router;
