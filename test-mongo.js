require('dotenv').config();
const setupDatabase = require('./database');

async function testConnection() {
    console.log("Attempting to connect to MongoDB URI:", process.env.MONGODB_URI);
    try {
        await setupDatabase();
        console.log("Connection test successful!");
        process.exit(0);
    } catch (error) {
        console.error("Connection test failed:", error);
        process.exit(1);
    }
}

testConnection();
