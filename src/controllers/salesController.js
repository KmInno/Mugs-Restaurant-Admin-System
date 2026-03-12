const salesModel = require('../models/salesModel');
const logger = require('../utils/logger');

async function showSalesPage(req, res) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { period = 'daily' } = req.query;
    
    let salesData = [];
    let periodLabel = 'Daily Sales';
    let timeOfDayStats = {};
    
    if (period === 'weekly') {
      salesData = await salesModel.getWeeklySales();
      periodLabel = 'Weekly Sales';
      
      // Get weekly stats by time of day
      const today_obj = new Date();
      const dayOfWeek = today_obj.getDay();
      const monday = new Date(today_obj);
      monday.setDate(today_obj.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const startDate = monday.toISOString().slice(0, 10);
      const endDate = sunday.toISOString().slice(0, 10);
      timeOfDayStats = await salesModel.getSalesStatsByTimeOfDay(startDate, endDate);
    } else if (period === 'monthly') {
      salesData = await salesModel.getMonthlySales();
      periodLabel = 'Monthly Sales';
      
      // Get monthly stats by time of day
      const today_obj = new Date();
      const startDate = new Date(today_obj.getFullYear(), today_obj.getMonth(), 1).toISOString().slice(0, 10);
      const endDate = new Date(today_obj.getFullYear(), today_obj.getMonth() + 1, 0).toISOString().slice(0, 10);
      timeOfDayStats = await salesModel.getSalesStatsByTimeOfDay(startDate, endDate);
    } else {
      // Daily
      const timeOfDayData = await salesModel.getSalesByTimeOfDay(today);
      salesData = timeOfDayData.breakfast.concat(timeOfDayData.lunch);
      timeOfDayStats = {
        breakfast: {
          total: timeOfDayData.breakfast.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0),
          count: timeOfDayData.breakfast.length
        },
        lunch: {
          total: timeOfDayData.lunch.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0),
          count: timeOfDayData.lunch.length
        }
      };
    }
    
    // Get breakfast and lunch for display
    const breakfastOrders = salesData.filter(s => new Date(s.created_at).getHours() < 12);
    const lunchOrders = salesData.filter(s => new Date(s.created_at).getHours() >= 12);
    
    const totalSales = salesData.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
    const totalDebtors = await salesModel.getTotalDebtorsForDate(today);
    
    logger.info(`showSalesPage period=${period} ${periodLabel} -> total sales=${totalSales} breakfast=${breakfastOrders.length} lunch=${lunchOrders.length}`);
    
    res.render('sales', {
      title: 'Sales',
      period,
      periodLabel,
      allSales: salesData,
      breakfastOrders,
      lunchOrders,
      totalSales,
      totalDebtors,
      timeOfDayStats,
      breakfastTotal: timeOfDayStats.breakfast?.total || 0,
      breakfastCount: timeOfDayStats.breakfast?.count || 0,
      lunchTotal: timeOfDayStats.lunch?.total || 0,
      lunchCount: timeOfDayStats.lunch?.count || 0
    });
  } catch (err) {
    logger.error('Error showing sales page: ' + (err && err.message ? err.message : err));
    res.render('sales', {
      title: 'Sales',
      period: 'daily',
      periodLabel: 'Daily Sales',
      allSales: [],
      breakfastOrders: [],
      lunchOrders: [],
      totalSales: 0,
      totalDebtors: 0,
      timeOfDayStats: { breakfast: { total: 0, count: 0 }, lunch: { total: 0, count: 0 } },
      breakfastTotal: 0,
      breakfastCount: 0,
      lunchTotal: 0,
      lunchCount: 0
    });
  }
}

async function showAddSalePage(req, res) {
  try {
    res.render('sales_add', { title: 'Add Sale' });
  } catch (err) {
    logger.error('Error rendering add sale page: ' + (err && err.message ? err.message : err));
    res.status(500).send('Unable to load add-sale page');
  }
}



async function addOrder(req, res) {
  try {
    logger.info(`addOrder payload: ${JSON.stringify(req.body)}`);
      const { amount, room_number, order_details, staff_id, status } = req.body;

    if (!amount) {
      logger.warn('addOrder: missing amount');
      return res.status(400).send('Amount is required');
    }
    if (!room_number) {
      logger.warn('addOrder: missing room_number');
      return res.status(400).send('Room number is required');
    }
    if (!order_details) {
      logger.warn('addOrder: missing order_details');
      return res.status(400).send('Order details are required');
    }

    const amountNum = parseFloat(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      logger.warn('addOrder: invalid amount', amount);
      return res.status(400).send('Invalid amount');
    }

    const staffIdNum = staff_id ? parseInt(staff_id, 10) : null;

      const sale = await salesModel.createSale(amountNum, room_number, order_details, staffIdNum, status || 'pending');

    if (sale && sale.insertId) {
      logger.info(`addOrder created sale id=${sale.insertId}`);
      return res.redirect('/sales');
    } else {
      logger.error('failed to add order');
      return res.status(500).send('Failed to add order');
    }
  } catch (err) {
    logger.error('Error adding order: ' + (err && err.message ? err.message : err) + (err && err.sqlMessage ? ' SQL: ' + err.sqlMessage : ''));
    return res.status(500).send('Failed to add order');
  }
}

async function updateSaleStatus(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const normalizedStatus = (status || '').toString().toLowerCase().trim().replace(/^complete$/,'completed');
    logger.info(`updateSaleStatus raw params id=${req.params.id} parsedId=${id} status=${status} normalized=${normalizedStatus}`);
    logger.info(`updateSaleStatus payload id=${id} status=${normalizedStatus}`);
    if (!id || !normalizedStatus) {
      logger.warn('updateSaleStatus: missing id or status');
      req.flash('error', 'Missing id or status');
      return res.redirect('/sales');
    }

    // check existing status first
    const sale = await salesModel.getSaleById(id);
    if (!sale) {
      logger.warn(`updateSaleStatus: sale not found id=${id}`);
      req.flash('error', 'Order not found');
      return res.redirect('/sales');
    }
    if ((sale.status || '').toString().toLowerCase() === 'completed' || (sale.status || '').toString().toLowerCase() === 'cancelled') {
      logger.warn(`updateSaleStatus: attempt to change finalized order id=${id} status=${sale.status}`);
      req.flash('error', 'Cannot change status of a completed or cancelled order');
      return res.redirect('/sales');
    }

    logger.info(`updateSaleStatus executing update id=${id} to status=${normalizedStatus}`);
    const result = await salesModel.updateSaleStatus(id, normalizedStatus);
    logger.info('updateSaleStatus result: ' + JSON.stringify(result));
    if (result && result.affectedRows && result.affectedRows > 0) {
      req.flash('success', 'Status updated');
      return res.redirect('/sales');
    }

    logger.warn(`updateSaleStatus: no rows affected for id=${id}`);
    logger.warn('updateSaleStatus debug', { sale, attemptedStatus: status, dbResult: result });
    req.flash('error', 'Unable to update status');
    return res.redirect('/sales');
  } catch (err) {
    logger.error('Error updating sale status: ' + (err && err.message ? err.message : err) + (err && err.sqlMessage ? ' SQL: ' + err.sqlMessage : ''));
    req.flash('error', 'Failed to update status');
    return res.redirect('/sales');
  }
}

// Added a method to fetch sales made on the current day
async function showTodaySales(req, res) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const todaySales = await salesModel.getSalesByDate(today);
    res.render('sales', { title: "Today's Sales", sales: todaySales, totalSales: todaySales.reduce((sum, sale) => sum + sale.amount, 0) });
  } catch (err) {
    logger.error('Error fetching today\'s sales: ' + (err && err.message ? err.message : err));
    res.render('sales', { title: "Today's Sales", sales: [], totalSales: 0 });
  }
}

async function showDebtorsPage(req, res) {
  try {
    const debtors = await salesModel.getDebtors();
    const totalDebtors = debtors.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    res.render('debtors', { title: 'Debtors', debtors, totalDebtors });
  } catch (err) {
    logger.error('Error showing debtors page: ' + (err && err.message ? err.message : err));
    res.render('debtors', { title: 'Debtors', debtors: [], totalDebtors: 0 });
  }
}

async function printSales(req, res) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { period = 'daily' } = req.query;
    
    let allSales = [];
    let totalSales = 0;
    
    if (period === 'weekly') {
      allSales = await salesModel.getWeeklySales();
    } else if (period === 'monthly') {
      allSales = await salesModel.getMonthlySales();
    } else {
      // Daily - get all sales with time period
      const timeOfDayData = await salesModel.getSalesByTimeOfDay(today);
      allSales = timeOfDayData.breakfast.concat(timeOfDayData.lunch);
    }
    
    totalSales = allSales.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
    
    logger.info(`printSales period=${period} -> ${allSales.length} sales`);
    
    res.render('sales_print', {
      title: 'Sales Print',
      allSales,
      totalSales,
      period
    });
  } catch (err) {
    logger.error('Error printing sales: ' + (err && err.message ? err.message : err));
    res.status(500).send('Failed to load print page');
  }
}

async function printSingleOrder(req, res) {
  try {
    const { id } = req.params;
    
    const sale = await salesModel.getSaleById(id);
    
    if (!sale) {
      logger.warn(`printSingleOrder: sale not found for id=${id}`);
      return res.status(404).send('Order not found');
    }
    
    // Get full sale details with staff info
    const salesForDate = await salesModel.getSalesForDate(new Date().toISOString().slice(0, 10));
    const saleWithStaff = salesForDate.find(s => s.id === parseInt(id)) || sale;
    
    logger.info(`printSingleOrder id=${id}`);
    
    res.render('sales_print_single', {
      title: 'Order Receipt',
      sale: saleWithStaff
    });
  } catch (err) {
    logger.error('Error printing order: ' + (err && err.message ? err.message : err));
    res.status(500).send('Failed to load print page');
  }
}

module.exports = { showSalesPage, showAddSalePage, addOrder, updateSaleStatus, showDebtorsPage, showTodaySales, printSales, printSingleOrder };


