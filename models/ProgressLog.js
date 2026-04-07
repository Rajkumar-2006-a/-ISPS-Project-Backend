const mongoose = require('mongoose');

const progressLogSchema = new mongoose.Schema({
    application_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    update_text: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProgressLog', progressLogSchema);
