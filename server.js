const express = require('express');
const cors = require('cors');
const setupDatabase = require('./database');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const applicationRoutes = require('./routes/applications');
const messageRoutes = require('./routes/messages');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'ISPS Backend API is running'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);

// Catch-all route to redirect any unhandled requests to the base API endpoint
app.get('*', (req, res) => {
    res.redirect('/');
});

const PORT = process.env.PORT || 5000;

setupDatabase().then(() => {
    // Only listen if not running on Vercel
    if (!process.env.VERCEL) {
        app.listen(PORT, () => {
            console.log(`ISPS Backend server running on http://localhost:${PORT}`);
        });
    }
}).catch(err => {
    console.error("Failed to start server:", err);
});

module.exports = app;
