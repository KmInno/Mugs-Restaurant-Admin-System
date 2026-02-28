
const initializeDatabase = require('../config/db');
const logger = require('../utils/logger');

async function getTotalSalesForDate(date) {
  const db = await initializeDatabase();
  try {
    // only include completed sales in the total
    const sql = "SELECT IFNULL(SUM(amount), 0) AS total FROM sales WHERE DATE(created_at) = ? AND LOWER(status) = 'completed'";
    const [rows] = await db.execute(sql, [date]);
    const total = rows[0].total || 0;
    logger.info(`getTotalSalesForDate ${date} -> ${total}`);
    return total;
  } catch (error) {
    throw error;
  } finally {
    await db.end();
  }
}

async function getTotalDebtorsForDate(date) {
  const db = await initializeDatabase();
  try {
    // sum amounts that are pending (debtors)
    const sql = "SELECT IFNULL(SUM(amount), 0) AS total FROM sales WHERE DATE(created_at) = ? AND LOWER(status) = 'pending'";
    const [rows] = await db.execute(sql, [date]);
    const total = rows[0].total || 0;
    logger.info(`getTotalDebtorsForDate ${date} -> ${total}`);
    return total;
  } catch (error) {
    throw error;
  } finally {
    await db.end();
  }
}

async function getTopStaffSalesForDate(date, limit = 5) {
  const db = await initializeDatabase();
  try {
    // Some MySQL drivers don't accept LIMIT as a prepared parameter — interpolate safely
    const safeLimit = Number.isInteger(limit) ? limit : parseInt(limit, 10) || 5;
    const sql = `
      SELECT u.id, u.name, IFNULL(SUM(s.amount), 0) AS sales
      FROM sales s
      JOIN users u ON s.staff_id = u.id
      WHERE DATE(s.created_at) = ?
      GROUP BY u.id
      ORDER BY sales DESC
      LIMIT ${safeLimit}`;
    const [rows] = await db.execute(sql, [date]);
    logger.info(`getTopStaffSalesForDate ${date} limit ${safeLimit} -> ${JSON.stringify(rows)}`);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    await db.end();
  }
}

async function createSale(amount, room_number, order_details, staff_id, status = 'pending', created_at = null) {
  const db = await initializeDatabase();
  try {
    const sql = 'INSERT INTO sales (amount, order_details, room_number, staff_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?)';
    const date = created_at || new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [result] = await db.execute(sql, [amount, order_details, room_number, staff_id, status, date]);
    logger.info(`createSale amount=${amount} room_number=${room_number} staff_id=${staff_id} status=${status} insertId=${result.insertId}`);
    return result;
  } catch (error) {
    throw error;
  } finally {
    await db.end();
  }
}

async function getSalesForDate(date) {
  const db = await initializeDatabase();
  try {
    const sql = 'SELECT s.id, s.amount, s.order_details, s.room_number, s.staff_id, s.status, s.created_at, u.name as staff_name FROM sales s LEFT JOIN users u ON s.staff_id = u.id WHERE DATE(s.created_at) = ? ORDER BY s.created_at DESC';
    const [rows] = await db.execute(sql, [date]);
    logger.info(`getSalesForDate ${date} -> ${rows.length} rows`);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    await db.end();
  }
}

async function getSaleById(id) {
  const db = await initializeDatabase();
  try {
    const sql = 'SELECT id, status FROM sales WHERE id = ? LIMIT 1';
    const [rows] = await db.execute(sql, [id]);
    return rows && rows.length ? rows[0] : null;
  } catch (error) {
    logger.error('Error fetching sale by id: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

async function getDebtors() {
  const db = await initializeDatabase();
  try {
    const sql = `SELECT s.id, s.amount, s.order_details, s.room_number, s.staff_id, s.status, s.created_at, u.name as staff_name FROM sales s LEFT JOIN users u ON s.staff_id = u.id WHERE LOWER(s.status) = 'pending' ORDER BY s.created_at DESC`;
    const [rows] = await db.execute(sql);
    logger.info(`getDebtors -> ${rows.length} rows`);
    return rows;
  } catch (error) {
    logger.error('Error fetching debtors: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

module.exports = { getTotalSalesForDate, getTopStaffSalesForDate, createSale, getSalesForDate };

async function getAllSales() {
  const db = await initializeDatabase();
  try {
    const sql = 'SELECT s.id, s.amount, s.order_details, s.room_number, s.staff_id, s.status, s.created_at, u.name as staff_name FROM sales s LEFT JOIN users u ON s.staff_id = u.id ORDER BY s.created_at DESC';
    const [rows] = await db.execute(sql);
    logger.info(`getAllSales -> ${rows.length} rows`);
    return rows;
  } catch (error) {
    logger.error('Error fetching all sales: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

module.exports = { getTotalSalesForDate, getTopStaffSalesForDate, createSale, getSalesForDate, getAllSales };

async function updateSaleStatus(id, status) {
  const db = await initializeDatabase();
  try {
    // Only update when current status is not already finalized
    const sql = "UPDATE sales SET status = ? WHERE id = ? AND status NOT IN ('completed','cancelled')";
    const [result] = await db.execute(sql, [status, id]);
    logger.info(`updateSaleStatus id=${id} status=${status} affected=${result.affectedRows}`);
    return result;
  } catch (error) {
    logger.error('Error updating sale status: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

module.exports = { getTotalSalesForDate, getTopStaffSalesForDate, createSale, getSalesForDate, getAllSales, updateSaleStatus, getSaleById, getTotalDebtorsForDate, getDebtors };
