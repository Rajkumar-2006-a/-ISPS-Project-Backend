const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    status: { 
        type: String, 
        default: 'applied', 
        enum: ['applied', 'faculty_approved', 'selected', 'rejected'] 
    },
    progress_percent: { type: Number, default: 0 },
    project_url: { type: String },
    marks: { type: Number },
    feedback: { type: String },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', applicationSchema);
