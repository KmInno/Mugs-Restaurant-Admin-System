const mysql = require('mysql2/promise');

// Migration script to add unit_price column to production table
async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'restaurant_db',
    port: 3307
  });

  try {
    console.log('Running migration: Adding unit_price column to production table...');
    
    // Check if column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'production' AND COLUMN_NAME = 'unit_price'
    `);

    if (columns.length === 0) {
      // Column doesn't exist, add it
      await connection.execute(`
        ALTER TABLE production ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0
      `);
      console.log('✓ Added unit_price column to production table');
    } else {
      console.log('✓ unit_price column already exists');
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
