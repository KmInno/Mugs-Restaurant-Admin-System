const initializeDB = require('../config/db');
const logger = require('../utils/logger');

async function getAllItems() {
  const db = await initializeDB();
  try {
    const sql = `SELECT i.id, i.name, i.sku, i.quantity, i.status, i.notes, i.added_by, i.created_at, u.name as added_by_name
                 FROM inventory i
                 LEFT JOIN users u ON i.added_by = u.id
                 ORDER BY i.name ASC`;
    const [rows] = await db.execute(sql);
    return rows;
  } catch (err) {
    logger.error('Error fetching inventory items: ' + (err && err.message ? err.message : err));
    throw err;
  } finally {
    await db.end();
  }
}

async function createItem({ name, sku = null, quantity = 0, notes = null, added_by = null }) {
  const db = await initializeDB();
  try {
    const sql = 'INSERT INTO inventory (name, sku, quantity, notes, added_by) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.execute(sql, [name, sku, quantity, notes, added_by]);
    logger.info(`createItem name=${name} insertId=${result.insertId}`);
    return result;
  } catch (err) {
    logger.error('Error creating inventory item: ' + (err && err.message ? err.message : err));
    throw err;
  } finally {
    await db.end();
  }
}

async function updateStatus(id, status) {
  const db = await initializeDB();
  try {
    const sql = 'UPDATE inventory SET status = ? WHERE id = ?';
    const [result] = await db.execute(sql, [status, id]);
    logger.info(`updateStatus id=${id} status=${status} affected=${result.affectedRows}`);
    return result;
  } catch (err) {
    logger.error('Error updating inventory status: ' + (err && err.message ? err.message : err));
    throw err;
  } finally {
    await db.end();
  }
}

module.exports = { getAllItems, createItem, updateStatus };
