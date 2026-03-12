// src/config/db.js
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function initializeDatabase() {
    try {
        // Load Azure certificate
        const caPath = path.join(__dirname, "DigiCertGlobalRootG2.crt.pem");
        const ca = fs.readFileSync(caPath, "utf8");
        
        const config = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            connectTimeout: 30000,
            ssl: process.env.DB_HOST && process.env.DB_HOST.includes("azure")
                ? { ca: ca, rejectUnauthorized: true }  // Use certificate for secure connection
                : false
        };

        console.log(`🔌 Attempting connection to ${config.host}:${config.port} as ${config.user} (SSL: ${!!config.ssl})`);
        
        const db = await mysql.createConnection(config);

        console.log("✅ Connected to MySQL database");
        return db;
    } catch (err) {
        console.error("❌ Failed to initialize database:", err.message);
        console.error("   Code:", err.code);
        console.error("   Errno:", err.errno);
        // Don’t throw immediately — let the app handle retries or show an error
        return null;
    }
}

module.exports = initializeDatabase;