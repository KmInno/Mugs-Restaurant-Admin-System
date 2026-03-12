const mysql = require("mysql2/promise");
require("dotenv").config();

async function initializeDatabase() {
    try {
        // Log environment variables status (without exposing sensitive data)
        console.log("🔍 Environment Variables Status:");
        console.log(`  DB_HOST: ${process.env.DB_HOST ? '✓ SET' : '✗ NOT SET (using default: localhost)'}`);
        console.log(`  DB_USER: ${process.env.DB_USER ? '✓ SET' : '✗ NOT SET (using default: root)'}`);
        console.log(`  DB_PASS: ${process.env.DB_PASS ? '✓ SET' : '✗ NOT SET (using default: root)'}`);
        console.log(`  DB_NAME: ${process.env.DB_NAME ? '✓ SET' : '✗ NOT SET (using default: restaurant_db)'}`);
        console.log(`  DB_PORT: ${process.env.DB_PORT || '(using default: 3307)'}`);
        
        const connectionConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || 'root',
            database: process.env.DB_NAME || 'restaurant_db',
            port: process.env.DB_PORT || 3307,
            ssl: process.env.DB_HOST && process.env.DB_HOST.includes('azure') ? {
                rejectUnauthorized: true,
                ca: undefined // Azure uses standard certificates
            } : false,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0
        };
        
        console.log(`💾 Connecting to MySQL at ${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database}...`);
        
        const db = await mysql.createConnection(connectionConfig);

        console.log("✅ Connected to MySQL database");
        return db;
    } catch (err) {
        console.error("❌ Database connection failed:", err.message);
        throw err;
    }
}

module.exports = initializeDatabase;


