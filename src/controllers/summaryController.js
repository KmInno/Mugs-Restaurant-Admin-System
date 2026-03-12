const salesModel = require('../models/salesModel');
const expenseModel = require('../models/expenseModel');
const productionModel = require('../models/productionModel');
const initializeDatabase = require('../config/db');
const logger = require('../utils/logger');

const summaryController = {};

// Helper function to get date range for the current week (Monday to Sunday)
function getWeekDateRange() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // Calculate Monday of the current week
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  // Calculate Sunday of the current week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    startDate: monday.toISOString().slice(0, 10),
    endDate: sunday.toISOString().slice(0, 10),
    mondayDate: monday
  };
}

// Get daily metrics for today
async function getDailyMetrics() {
  const today = new Date().toISOString().slice(0, 10);
  
  try {
    const [totalSales, totalExpenses, totalProduction] = await Promise.all([
      salesModel.getTotalSalesForDate(today),
      expenseModel.getTotalExpensesForDate(today),
      productionModel.getTotalForDate(today)
    ]);
    
    const profit = parseFloat(totalSales) - parseFloat(totalExpenses);
    
    return {
      date: today,
      salesBeforeExpenses: parseFloat(totalSales) || 0,
      totalExpenses: parseFloat(totalExpenses) || 0,
      profitAfterExpenses: profit >= 0 ? profit : 0,
      totalProduction: parseInt(totalProduction) || 0
    };
  } catch (error) {
    logger.error('Error fetching daily metrics: ' + (error && error.message ? error.message : error));
    return {
      date: today,
      salesBeforeExpenses: 0,
      totalExpenses: 0,
      profitAfterExpenses: 0,
      totalProduction: 0
    };
  }
}

// Get staff weekly performance
async function getStaffWeeklyPerformance() {
  const db = await initializeDatabase();
  try {
    const { startDate, endDate } = getWeekDateRange();
    
    const sql = `
      SELECT 
        u.id,
        u.name,
        COUNT(s.id) as sales_count,
        IFNULL(SUM(s.amount), 0) as total_sales,
        IFNULL(AVG(s.amount), 0) as avg_sale
      FROM users u
      LEFT JOIN sales s ON u.id = s.staff_id AND DATE(s.created_at) BETWEEN ? AND ?
      WHERE u.role = 'staff' OR u.role = 'employee'
      GROUP BY u.id, u.name
      ORDER BY total_sales DESC
    `;
    
    const [rows] = await db.execute(sql, [startDate, endDate]);
    logger.info(`getStaffWeeklyPerformance ${startDate} to ${endDate} -> ${rows.length} staff members`);
    
    return rows || [];
  } catch (error) {
    logger.error('Error fetching staff weekly performance: ' + (error && error.message ? error.message : error));
    return [];
  } finally {
    await db.end();
  }
}

// Get sales trend for the week
async function getSalesTrendForWeek() {
  const db = await initializeDatabase();
  try {
    const { startDate, endDate } = getWeekDateRange();
    
    const sql = `
      SELECT 
        DATE(created_at) as date,
        IFNULL(SUM(amount), 0) as daily_total,
        COUNT(*) as transaction_count
      FROM sales
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    const [rows] = await db.execute(sql, [startDate, endDate]);
    logger.info(`getSalesTrendForWeek ${startDate} to ${endDate} -> ${rows.length} days`);
    
    return rows || [];
  } catch (error) {
    logger.error('Error fetching sales trend: ' + (error && error.message ? error.message : error));
    return [];
  } finally {
    await db.end();
  }
}

// Get expense breakdown
async function getExpenseBreakdown() {
  const db = await initializeDatabase();
  try {
    const { startDate, endDate } = getWeekDateRange();
    
    const sql = `
      SELECT 
        description,
        IFNULL(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM expenses
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY description
      ORDER BY total DESC
    `;
    
    const [rows] = await db.execute(sql, [startDate, endDate]);
    logger.info(`getExpenseBreakdown ${startDate} to ${endDate} -> ${rows.length} categories`);
    
    return rows || [];
  } catch (error) {
    logger.error('Error fetching expense breakdown: ' + (error && error.message ? error.message : error));
    return [];
  } finally {
    await db.end();
  }
}

// Get production breakdown
async function getProductionBreakdown() {
  const db = await initializeDatabase();
  try {
    const { startDate, endDate } = getWeekDateRange();
    
    const sql = `
      SELECT 
        item,
        IFNULL(SUM(quantity), 0) as total_quantity,
        COUNT(*) as entries
      FROM production
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY item
      ORDER BY total_quantity DESC
    `;
    
    const [rows] = await db.execute(sql, [startDate, endDate]);
    logger.info(`getProductionBreakdown ${startDate} to ${endDate} -> ${rows.length} items`);
    
    return rows || [];
  } catch (error) {
    logger.error('Error fetching production breakdown: ' + (error && error.message ? error.message : error));
    return [];
  } finally {
    await db.end();
  }
}

// Get weekly expense total
async function getWeeklyExpenseTotal() {
  const db = await initializeDatabase();
  try {
    const { startDate, endDate } = getWeekDateRange();
    
    const sql = `
      SELECT IFNULL(SUM(amount), 0) as total
      FROM expenses
      WHERE DATE(created_at) BETWEEN ? AND ?
    `;
    
    const [rows] = await db.execute(sql, [startDate, endDate]);
    logger.info(`getWeeklyExpenseTotal ${startDate} to ${endDate} -> ${rows[0].total}`);
    
    return parseFloat(rows[0].total) || 0;
  } catch (error) {
    logger.error('Error fetching weekly expense total: ' + (error && error.message ? error.message : error));
    return 0;
  } finally {
    await db.end();
  }
}

// Get weekly sales total
async function getWeeklySalesTotal() {
  const db = await initializeDatabase();
  try {
    const { startDate, endDate } = getWeekDateRange();
    
    const sql = `
      SELECT IFNULL(SUM(amount), 0) as total
      FROM sales
      WHERE DATE(created_at) BETWEEN ? AND ?
    `;
    
    const [rows] = await db.execute(sql, [startDate, endDate]);
    logger.info(`getWeeklySalesTotal ${startDate} to ${endDate} -> ${rows[0].total}`);
    
    return parseFloat(rows[0].total) || 0;
  } catch (error) {
    logger.error('Error fetching weekly sales total: ' + (error && error.message ? error.message : error));
    return 0;
  } finally {
    await db.end();
  }
}

// Main summary page controller
summaryController.buildSummaryPage = async function (req, res, next) {
  try {
    const user = req.session && req.session.user ? req.session.user : null;

    const [
      dailyMetrics,
      staffWeekly,
      salesTrend,
      expenseBreakdown,
      productionBreakdown,
      weeklyExpenseTotal,
      weeklySalesTotal
    ] = await Promise.all([
      getDailyMetrics(),
      getStaffWeeklyPerformance(),
      getSalesTrendForWeek(),
      getExpenseBreakdown(),
      getProductionBreakdown(),
      getWeeklyExpenseTotal(),
      getWeeklySalesTotal()
    ]);

    const weeklyProfit = weeklySalesTotal - weeklyExpenseTotal;
    const { startDate, endDate } = getWeekDateRange();

    logger.info(`Summary page loaded: daily_sales=${dailyMetrics.salesBeforeExpenses} daily_profit=${dailyMetrics.profitAfterExpenses} weekly_profit=${weeklyProfit}`);

    res.render('summary', {
      title: 'Business Summary',
      userName: user ? (user.email || 'Admin') : 'Admin',
      dailyMetrics,
      staffWeekly,
      salesTrend,
      expenseBreakdown,
      productionBreakdown,
      weeklyExpenseTotal,
      weeklySalesTotal,
      weeklyProfit,
      weekStartDate: startDate,
      weekEndDate: endDate
    });
  } catch (err) {
    logger.error('Error building summary page: ' + (err && err.message ? err.message : err));
    res.status(500).send('Failed to load summary page');
  }
};

module.exports = summaryController;
