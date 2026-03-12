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
        
        const isAzure = process.env.DB_HOST && process.env.DB_HOST.includes('azure');
        console.log(`  SSL: ${isAzure ? '✓ ENABLED (Azure MySQL)' : '✗ DISABLED'}`);
        
        // Configuration for Azure MySQL
        const connectionConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || 'root',
            database: process.env.DB_NAME || 'restaurant_db',
            port: parseInt(process.env.DB_PORT) || 3306,
            insecureAuth: false,
            enableKeepAlive: true,
            connectionTimeout: 10000,  // 10 second timeout
            ssl: isAzure ? 'Amazon' : false,  // Azure MySQL uses Amazon certificate bundle
            authPlugins: {
                mysql_clear_password: () => () => process.env.DB_PASS || 'root',
                mysql_native_password: () => () => process.env.DB_PASS || 'root'
            }
        };
        
        console.log(`💾 Connecting to MySQL at ${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database}...`);
        
        const db = await mysql.createConnection(connectionConfig);

        console.log("✅ Connected to MySQL database successfully!");
        return db;
    } catch (err) {
        console.error("❌ Database connection failed!");
        console.error("   Error Code:", err.code || 'UNKNOWN');
        console.error("   Error Message:", err.message);
        console.error("   Error Number:", err.errno || 'No errno');
        
        // Common Azure MySQL connection issues
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error("   ℹ️  Tip: Connection lost - this usually means the database server lost the connection");
        } else if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
            console.error("   ℹ️  Tip: Fatal error - the connection cannot be recovered");
        } else if (err.code === 'ECONNREFUSED') {
            console.error("   ℹ️  Tip: Connection refused - check if DB_HOST and DB_PORT are correct");
        } else if (err.code === 'ENOTFOUND') {
            console.error("   ℹ️  Tip: DNS lookup failed - verify DB_HOST hostname spelling");
        } else if (err.code === 'ETIMEDOUT') {
            console.error("   ℹ️  Tip: Connection timeout - database server is not responding within 10 seconds");
            console.error("   ℹ️  For Azure MySQL: Check firewall rules to allow Render IP");
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error("   ℹ️  Tip: Access denied - check DB_USER and DB_PASS credentials");
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            console.error("   ℹ️  Tip: Database does not exist - check DB_NAME setting");
        }
        
        // Re-throw to stop server startup
        throw err;
    }
}

module.exports = initializeDatabase;


