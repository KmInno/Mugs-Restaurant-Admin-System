const salesModel = require('../models/salesModel');
const logger = require('../utils/logger');

async function showSalesPage(req, res) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [todayTotal, allSales, totalDebtors] = await Promise.all([
      salesModel.getTotalSalesForDate(today),
      salesModel.getAllSales(),
      salesModel.getTotalDebtorsForDate(today)
    ]);
    logger.info(`showSalesPage todayTotal=${todayTotal} allSalesCount=${allSales.length}`);
    res.render('sales', { title: 'Sales', sales: allSales, totalSales: todayTotal, totalDebtors });
  } catch (err) {
    logger.error('Error showing sales page: ' + (err && err.message ? err.message : err));
    res.render('sales', { title: 'Sales', sales: [], totalSales: 0, totalDebtors: 0 });
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

module.exports = { showSalesPage, showAddSalePage, addOrder, updateSaleStatus };

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

module.exports = { showSalesPage, showAddSalePage, addOrder, updateSaleStatus, showDebtorsPage };


