const mysql = require('mysql2/promise');

// Migration script to add payment_status column
async function runMigration() {
  require('dotenv').config();
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'root',
    database: process.env.DB_NAME || 'restaurant_db',
    port: process.env.DB_PORT || 3307,
    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('azure') ? {
      rejectUnauthorized: true,
      ca: undefined
    } : false
  });

  try {
    console.log('Running migration: Adding payment_status column...');
    
    // Check if column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'sales' AND COLUMN_NAME = 'payment_status'
    `);

    if (columns.length === 0) {
      // Column doesn't exist, add it
      await connection.execute(`
        ALTER TABLE sales ADD COLUMN payment_status VARCHAR(50) DEFAULT 'unpaid'
      `);
      console.log('✓ Added payment_status column to sales table');
    } else {
      console.log('✓ payment_status column already exists');
    }

    await connection.end();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error.message);
    await connection.end();
    process.exit(1);
  }
}

runMigration();
