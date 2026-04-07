const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Project = require('./models/Project');
const Application = require('./models/Application');

async function seed() {
    try {
        await mongoose.connect('mongodb://localhost:27017/ISPS_NewProject');
        console.log("Connected to MongoDB (ISPS_NewProject) for seeding...");

        // Drop the entire database to clear stale indexes and data
        await mongoose.connection.db.dropDatabase();
        console.log("Database 'isps' dropped for a clean start.");

        const hashed = await bcrypt.hash('password123', 10);

        // 1. Create Users
        const admin = await User.create({ name: 'Admin', email: 'admin@isps.com', password: hashed, role: 'admin' });
        const faculty = await User.create({ name: 'Faculty Guide', email: 'faculty@isps.com', password: hashed, role: 'faculty' });
        const industry = await User.create({ name: 'Industry Mentor', email: 'mentor@isps.com', password: hashed, role: 'industry' });
        const student = await User.create({ name: 'Student Code', email: 'student@isps.com', password: hashed, role: 'student' });
        console.log("Created sample users.");

        // 2. Create Projects
        const p1 = await Project.create({
            title: 'AI Dashboard Migration',
            description: 'Move current systems to a modern AI-powered dashboard with real-time tracking.',
            duration: '3 Months',
            skills_required: 'React, Node, MongoDB',
            industry_mentor_id: industry._id,
            status: 'approved',
            faculty_id: faculty._id
        });
        
        const p2 = await Project.create({
            title: 'Cloud Security Enhancement',
            description: 'Audit and improve the security protocols for a multi-tenant cloud application.',
            duration: '6 Months',
            skills_required: 'Docker, AWS, Security',
            industry_mentor_id: industry._id,
            status: 'approved'
        });
        console.log("Created sample projects.");

        // 3. Create Application
        await Application.create({
            student_id: student._id,
            project_id: p1._id,
            status: 'selected',
            progress_percent: 50,
            project_url: 'https://github.com/example/ai-dashboard'
        });
        console.log("Created sample application.");

        console.log("Seeding complete! You can now login with password123 for all accounts.");
        process.exit();
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
}

seed();
