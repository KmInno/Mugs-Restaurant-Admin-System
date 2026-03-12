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

async function getSalesByDate(date) {
  const db = await initializeDatabase();
  try {
    const sql = 'SELECT s.id, s.amount, s.order_details, s.room_number, s.staff_id, s.status, s.created_at, u.name as staff_name FROM sales s LEFT JOIN users u ON s.staff_id = u.id WHERE DATE(s.created_at) = ? ORDER BY s.created_at DESC';
    const [rows] = await db.execute(sql, [date]);
    logger.info(`getSalesByDate ${date} -> ${rows.length} rows`);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    await db.end();
  }
}

module.exports = { getTotalSalesForDate, getTopStaffSalesForDate, createSale, getSalesForDate, getSalesByDate };

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

module.exports = { getTotalSalesForDate, getTopStaffSalesForDate, createSale, getSalesForDate, getSalesByDate, getAllSales };

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

// Get sales classification by time of day
async function getSalesByTimeOfDay(date) {
  const db = await initializeDatabase();
  try {
    const sql = `SELECT s.id, s.amount, s.order_details, s.room_number, s.staff_id, s.status, s.created_at, u.name as staff_name, 
                 CASE 
                   WHEN HOUR(s.created_at) < 12 THEN 'breakfast'
                   ELSE 'lunch'
                 END as meal_type
                 FROM sales s 
                 LEFT JOIN users u ON s.staff_id = u.id 
                 WHERE DATE(s.created_at) = ? 
                 ORDER BY s.created_at DESC`;
    const [rows] = await db.execute(sql, [date]);
    
    const breakfast = rows.filter(r => r.meal_type === 'breakfast');
    const lunch = rows.filter(r => r.meal_type === 'lunch');
    
    logger.info(`getSalesByTimeOfDay ${date} -> breakfast: ${breakfast.length}, lunch: ${lunch.length}`);
    return { breakfast, lunch, total: rows.length };
  } catch (error) {
    logger.error('Error fetching sales by time of day: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

// Get daily sales (current date)
async function getDailySales() {
  const db = await initializeDatabase();
  try {
    const today = new Date().toISOString().slice(0, 10);
    const sql = `SELECT s.id, s.amount, s.order_details, s.room_number, s.staff_id, s.status, s.created_at, u.name as staff_name 
                 FROM sales s 
                 LEFT JOIN users u ON s.staff_id = u.id 
                 WHERE DATE(s.created_at) = ? 
                 ORDER BY s.created_at DESC`;
    const [rows] = await db.execute(sql, [today]);
    logger.info(`getDailySales -> ${rows.length} rows`);
    return rows;
  } catch (error) {
    logger.error('Error fetching daily sales: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

// Get weekly sales (current week)
async function getWeeklySales() {
  const db = await initializeDatabase();
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const startDate = monday.toISOString().slice(0, 10);
    const endDate = sunday.toISOString().slice(0, 10);
    
    const sql = `SELECT s.id, s.amount, s.order_details, s.room_number, s.staff_id, s.status, s.created_at, u.name as staff_name, DATE(s.created_at) as sale_date
                 FROM sales s 
                 LEFT JOIN users u ON s.staff_id = u.id 
                 WHERE DATE(s.created_at) BETWEEN ? AND ? 
                 ORDER BY s.created_at DESC`;
    const [rows] = await db.execute(sql, [startDate, endDate]);
    logger.info(`getWeeklySales ${startDate} to ${endDate} -> ${rows.length} rows`);
    return rows;
  } catch (error) {
    logger.error('Error fetching weekly sales: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

// Get monthly sales (current month)
async function getMonthlySales() {
  const db = await initializeDatabase();
  try {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
    
    const sql = `SELECT s.id, s.amount, s.order_details, s.room_number, s.staff_id, s.status, s.created_at, u.name as staff_name, DATE(s.created_at) as sale_date
                 FROM sales s 
                 LEFT JOIN users u ON s.staff_id = u.id 
                 WHERE DATE(s.created_at) BETWEEN ? AND ? 
                 ORDER BY s.created_at DESC`;
    const [rows] = await db.execute(sql, [startDate, endDate]);
    logger.info(`getMonthlySales ${startDate} to ${endDate} -> ${rows.length} rows`);
    return rows;
  } catch (error) {
    logger.error('Error fetching monthly sales: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

// Get sales statistics for a date range
async function getSalesStatsByTimeOfDay(startDate, endDate) {
  const db = await initializeDatabase();
  try {
    const sql = `SELECT 
                   CASE 
                     WHEN HOUR(s.created_at) < 12 THEN 'breakfast'
                     ELSE 'lunch'
                   END as meal_type,
                   IFNULL(SUM(s.amount), 0) as total_amount,
                   COUNT(*) as count
                 FROM sales s 
                 WHERE DATE(s.created_at) BETWEEN ? AND ?
                 GROUP BY meal_type`;
    const [rows] = await db.execute(sql, [startDate, endDate]);
    
    const stats = {
      breakfast: { total: 0, count: 0 },
      lunch: { total: 0, count: 0 }
    };
    
    rows.forEach(row => {
      if (row.meal_type === 'breakfast') {
        stats.breakfast = { total: row.total_amount, count: row.count };
      } else {
        stats.lunch = { total: row.total_amount, count: row.count };
      }
    });
    
    logger.info(`getSalesStatsByTimeOfDay ${startDate} to ${endDate}:`, JSON.stringify(stats));
    return stats;
  } catch (error) {
    logger.error('Error fetching sales stats: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

// Get staff clearance data for a specific date
async function getStaffClearanceForDate(date) {
  const db = await initializeDatabase();
  try {
    const sql = `
      SELECT 
        u.id as staff_id,
        u.name as staff_name,
        u.email as staff_email,
        COUNT(s.id) as total_orders,
        IFNULL(SUM(s.amount), 0) as total_sales,
        IFNULL(SUM(CASE WHEN s.payment_status = 'paid' THEN s.amount ELSE 0 END), 0) as paid_amount,
        IFNULL(SUM(CASE WHEN s.payment_status = 'unpaid' THEN s.amount ELSE 0 END), 0) as unpaid_amount,
        COUNT(CASE WHEN s.payment_status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN s.payment_status = 'unpaid' THEN 1 END) as unpaid_count
      FROM users u
      LEFT JOIN sales s ON u.id = s.staff_id AND DATE(s.created_at) = ?
      WHERE u.role IN ('staff', 'employee')
      GROUP BY u.id, u.name, u.email
      ORDER BY u.name ASC
    `;
    const [rows] = await db.execute(sql, [date]);
    logger.info(`getStaffClearanceForDate ${date} -> ${rows.length} staff members`);
    return rows || [];
  } catch (error) {
    logger.error('Error fetching staff clearance: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

// Get detailed sales for a specific staff member on a date
async function getStaffSalesForDate(staffId, date) {
  const db = await initializeDatabase();
  try {
    const sql = `
      SELECT s.id, s.amount, s.room_number, s.order_details, s.status, s.payment_status, s.created_at, u.name as staff_name
      FROM sales s
      LEFT JOIN users u ON s.staff_id = u.id
      WHERE s.staff_id = ? AND DATE(s.created_at) = ?
      ORDER BY s.created_at DESC
    `;
    const [rows] = await db.execute(sql, [staffId, date]);
    logger.info(`getStaffSalesForDate staffId=${staffId} date=${date} -> ${rows.length} sales`);
    return rows || [];
  } catch (error) {
    logger.error('Error fetching staff sales: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

// Update payment status for a sale
async function updatePaymentStatus(saleId, paymentStatus) {
  const db = await initializeDatabase();
  try {
    const sql = 'UPDATE sales SET payment_status = ? WHERE id = ?';
    const [result] = await db.execute(sql, [paymentStatus, saleId]);
    logger.info(`updatePaymentStatus id=${saleId} payment_status=${paymentStatus} affected=${result.affectedRows}`);
    return result;
  } catch (error) {
    logger.error('Error updating payment status: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

// Get all unpaid sales from previous days as debtors
async function getUnpaidDebts() {
  const db = await initializeDatabase();
  try {
    const sql = `
      SELECT 
        s.id,
        s.amount,
        s.room_number,
        s.order_details,
        s.created_at,
        u.id as staff_id,
        u.name as staff_name,
        DATEDIFF(CURDATE(), DATE(s.created_at)) as days_outstanding
      FROM sales s
      LEFT JOIN users u ON s.staff_id = u.id
      WHERE s.payment_status = 'unpaid' AND DATE(s.created_at) < CURDATE()
      ORDER BY s.created_at ASC
    `;
    const [rows] = await db.execute(sql);
    logger.info(`getUnpaidDebts -> ${rows.length} unpaid sales`);
    return rows || [];
  } catch (error) {
    logger.error('Error fetching unpaid debts: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

// Get total unpaid amounts by staff member
async function getUnpaidByStaff() {
  const db = await initializeDatabase();
  try {
    const sql = `
      SELECT 
        u.id as staff_id,
        u.name as staff_name,
        COUNT(s.id) as unpaid_count,
        IFNULL(SUM(s.amount), 0) as unpaid_total,
        MAX(s.created_at) as last_unpaid_date
      FROM users u
      LEFT JOIN sales s ON u.id = s.staff_id AND s.payment_status = 'unpaid' AND DATE(s.created_at) < CURDATE()
      WHERE u.role IN ('staff', 'employee')
      GROUP BY u.id, u.name
      HAVING unpaid_count > 0
      ORDER BY unpaid_total DESC
    `;
    const [rows] = await db.execute(sql);
    logger.info(`getUnpaidByStaff -> ${rows.length} staff with unpaid debts`);
    return rows || [];
  } catch (error) {
    logger.error('Error fetching unpaid by staff: ' + (error && error.message ? error.message : error));
    throw error;
  } finally {
    await db.end();
  }
}

module.exports = { getTotalSalesForDate, getTopStaffSalesForDate, createSale, getSalesForDate, getSalesByDate, getAllSales, updateSaleStatus, getSaleById, getTotalDebtorsForDate, getDebtors, getSalesByTimeOfDay, getDailySales, getWeeklySales, getMonthlySales, getSalesStatsByTimeOfDay, getStaffClearanceForDate, getStaffSalesForDate, updatePaymentStatus, getUnpaidDebts, getUnpaidByStaff };
