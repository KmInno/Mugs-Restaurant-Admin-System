const mysql = require('mysql2/promise');

async function addInventoryData() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'restaurant_db',
    port: 3307,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    const query = `INSERT INTO inventory (name, sku, quantity, status, notes, added_by) VALUES
      ('Coffee Beans - Arabica', 'SKU-001', 45, 'instock', 'Premium arabica, freshly roasted', 1),
      ('Sugar - Refined', 'SKU-002', 120, 'instock', '10kg bags', 1),
      ('Milk Powder', 'SKU-003', 8, 'outofstock', 'Needs restocking soon', 1),
      ('Tea Leaves - Black', 'SKU-004', 25, 'instock', 'Earl Grey, loose leaf', 2),
      ('Bakery Flour - All Purpose', 'SKU-005', 50, 'instock', '25kg sacks', 1),
      ('Honey - Pure', 'SKU-006', 5, 'instock', '1L bottles', 2),
      ('Cooking Oil - Vegetable', 'SKU-007', 12, 'instock', '5L jerrycans', 1),
      ('Eggs - Brown', 'SKU-008', 0, 'outofstock', 'Order placed, arriving tomorrow', 3)`;
    
    await db.execute(query);
    console.log('✓ Inventory items added successfully');
    await db.end();
    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.message);
    await db.end();
    process.exit(1);
  }
}

addInventoryData();
