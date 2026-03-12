require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('Attempting to connect with:');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`Password length: ${process.env.DB_PASS.length} characters`);
    
    console.log('Test 1: Trying with SSL disabled...\n');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      connectTimeout: 30000,
      ssl: false  // Try without SSL first
    });

    console.log('✅ Connection successful!');
    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Message: ${error.message}`);
    console.error(`SQL State: ${error.sqlState}`);
    console.error('\nCommon fixes:');
    console.error('1. Add your IP (41.75.173.17) to Azure MySQL firewall');
    console.error('2. Verify the password is correct');
    console.error('3. Check that the database exists');
    process.exit(1);
  }
}

testConnection();
