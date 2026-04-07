const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, required: true },
    skills_required: { type: String },
    industry_mentor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
        type: String, 
        default: 'pending', 
        enum: ['pending', 'approved', 'rejected', 'in-progress', 'completed', 'deleted'] 
    },
    faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);
