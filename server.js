require('dotenv').config();
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

function resolvePort() {
    if (process.env.PORT) {
        return process.env.PORT;
    }

    if (process.env.VITE_API_URL) {
        try {
            const parsedUrl = new URL(process.env.VITE_API_URL);
            if (parsedUrl.port) {
                return parsedUrl.port;
            }

            return parsedUrl.protocol === 'https:' ? 443 : 80;
        } catch (error) {
            console.warn(`Invalid VITE_API_URL provided: ${process.env.VITE_API_URL}`);
        }
    }

    return 5000;
}

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

const PORT = resolvePort();

setupDatabase().then(() => {
    app.listen(PORT, () => {
        const displayUrl = process.env.VITE_API_URL || `http://localhost:${PORT}/api`;
        console.log(`ISPS Backend server running for ${displayUrl}`);
    });
}).catch(err => {
    console.error("Failed to start server:", err);
});
