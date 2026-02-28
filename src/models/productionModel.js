const initializeDatabase = require('../config/db');
const logger = require('../utils/logger');

async function ensureTable(db) {
  // create table if not exists
  const sql = `
    CREATE TABLE IF NOT EXISTS production (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item VARCHAR(255) NOT NULL,
      quantity INT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`;
  await db.execute(sql);
}

async function createEntry(item, quantity, created_at = null) {
  const db = await initializeDatabase();
  try {
    await ensureTable(db);
    const date = created_at || new Date().toISOString().slice(0, 19).replace('T', ' ');
    const sql = 'INSERT INTO production (item, quantity, created_at) VALUES (?, ?, ?)';
    const [result] = await db.execute(sql, [item, quantity, date]);
    logger.info(`createEntry item=${item} quantity=${quantity} insertId=${result.insertId}`);
    return result;
  } catch (error) {
    logger.error('Error creating production entry: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

async function getEntriesForDate(date) {
  const db = await initializeDatabase();
  try {
    await ensureTable(db);
    const sql = `SELECT id, item, quantity, created_at FROM production WHERE DATE(created_at) = ? ORDER BY created_at DESC`;
    const [rows] = await db.execute(sql, [date]);
    logger.info(`getEntriesForDate ${date} -> ${rows.length} rows`);
    return rows;
  } catch (error) {
    logger.error('Error fetching production entries: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

async function getTotalForDate(date) {
  const db = await initializeDatabase();
  try {
    await ensureTable(db);
    const sql = `SELECT IFNULL(SUM(quantity), 0) AS total FROM production WHERE DATE(created_at) = ?`;
    const [rows] = await db.execute(sql, [date]);
    const total = rows && rows[0] ? rows[0].total : 0;
    logger.info(`getTotalForDate ${date} -> ${total}`);
    return total;
  } catch (error) {
    logger.error('Error fetching production total: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

module.exports = { createEntry, getEntriesForDate, getTotalForDate };