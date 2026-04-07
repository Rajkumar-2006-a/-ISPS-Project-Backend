const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Get unread counts for the current user grouped by sender and project
router.get('/unread/counts', authenticate, async (req, res) => {
    try {
        const counts = await Message.aggregate([
            { $match: { receiver_id: new mongoose.Types.ObjectId(req.user.id), is_read: false } },
            { $group: { _id: { sender_id: "$sender_id", project_id: "$project_id" }, count: { $sum: 1 } } }
        ]);
        // Format: [{ sender_id, project_id, count }]
        res.json(counts.map(c => ({ 
            sender_id: c._id.sender_id, 
            project_id: c._id.project_id, 
            count: c.count 
        })));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch unread counts' });
    }
});

// Mark messages from a specific sender as read
router.put('/read/:senderId', authenticate, async (req, res) => {
    const { project_id } = req.query;
    try {
        let filter = { receiver_id: req.user.id, sender_id: req.params.senderId, is_read: false };
        if (project_id) {
            filter.project_id = project_id;
        }
        await Message.updateMany(filter, { is_read: true });
        res.json({ message: 'Messages marked as read' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

// Get conversation with a specific user
router.get('/:otherUserId', authenticate, async (req, res) => {
    const { project_id } = req.query;
    try {
        let filter = {
            $or: [
                { sender_id: req.user.id, receiver_id: req.params.otherUserId },
                { sender_id: req.params.otherUserId, receiver_id: req.user.id }
            ]
        };
        if (project_id) {
            filter.project_id = project_id;
        }

        const messages = await Message.find(filter)
        .populate('sender_id', 'name')
        .sort({ created_at: 1 });

        // Map to match old structure (sender_name and string IDs)
        const formatted = messages.map(m => {
            const obj = m.toObject();
            return {
                ...obj,
                id: obj._id,
                sender_id: obj.sender_id?._id || obj.sender_id,
                sender_name: m.sender_id?.name
            };
        });

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send a message
router.post('/', authenticate, async (req, res) => {
    const { receiver_id, project_id, content } = req.body;
    if (!receiver_id || !content) {
        return res.status(400).json({ error: 'Receiver and content are required' });
    }
    try {
        const message = await Message.create({
            sender_id: req.user.id,
            receiver_id,
            project_id,
            content
        });
        res.status(201).json({ message: 'Message sent', id: message._id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

module.exports = router;
