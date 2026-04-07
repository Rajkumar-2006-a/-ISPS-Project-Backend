const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

let isConnected = false;

async function setupDatabase() {
    if (isConnected) return mongoose.connection;

    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ISPS_NewProject';
        await mongoose.connect(mongoURI);
        isConnected = true;
        console.log("Connected to MongoDB successfully via Mongoose.");

        // Ensure standard admin user exists
        const adminEmail = 'admin@isps.com';
        const adminExt = await User.findOne({ email: adminEmail });
        
        if (!adminExt) {
            const hash = await bcrypt.hash('password123', 10);
            await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: hash,
                role: 'admin'
            });
            console.log("Default admin account created: admin@isps.com / password123");
        }

        return mongoose.connection;
    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        throw err;
    }
}

module.exports = setupDatabase;
