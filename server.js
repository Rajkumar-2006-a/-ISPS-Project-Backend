const express = require('express');
const cors = require('cors');
require('dotenv').config();

const setupDatabase = require('./database');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const applicationRoutes = require('./routes/applications');
const messageRoutes = require('./routes/messages');

const app = express();

const envOrigins = [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
    process.env.FRONTEND_ORIGIN
].flatMap(value => (value || '').split(','));

const defaultOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://is-ps-project-frontend.vercel.app'
];

const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins]
    .map(origin => origin.trim())
    .filter(Boolean))];

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.warn(`Blocked CORS origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'ISPS Backend API is running',
        apiBase: '/api'
    });
});

app.get('/api', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'ISPS API is ready'
    });
});

app.use('/api', async (req, res, next) => {
    try {
        await setupDatabase();
        return next();
    } catch (err) {
        console.error('Database setup failed during request:', err);
        return res.status(500).json({
            error: 'Database connection failed'
        });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
});

app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: err.message });
    }

    return next(err);
});

app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        apiBase: '/api'
    });
});

const PORT = process.env.PORT || 5000;

// Only listen if not running on Vercel
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`ISPS Backend server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
