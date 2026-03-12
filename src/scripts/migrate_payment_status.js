const mysql = require('mysql2/promise');

// Migration script to add payment_status column
async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'restaurant_db',
    port: 3307
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
