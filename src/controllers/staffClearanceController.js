const salesModel = require('../models/salesModel');
const logger = require('../utils/logger');

const staffClearanceController = {};

// Show staff clearance page for today
staffClearanceController.showStaffClearancePage = async function (req, res, next) {
  try {
    const user = req.session && req.session.user ? req.session.user : null;
    
    // Only admins can view staff clearance page
    if (!user || user.role !== 'admin') {
      logger.warn(`Unauthorized access to staff clearance by user: ${user ? user.email : 'anonymous'}`);
      return res.status(403).send('Access Denied: Only administrators can access this page.');
    }

    const today = new Date().toISOString().slice(0, 10);
    const { date = today } = req.query;

    // Get staff clearance data
    const staffClearance = await salesModel.getStaffClearanceForDate(date);

    // Calculate totals
    const totals = {
      totalStaff: staffClearance.length,
      totalOrders: staffClearance.reduce((sum, s) => sum + s.total_orders, 0),
      totalSales: staffClearance.reduce((sum, s) => sum + parseFloat(s.total_sales), 0),
      totalPaid: staffClearance.reduce((sum, s) => sum + parseFloat(s.paid_amount), 0),
      totalUnpaid: staffClearance.reduce((sum, s) => sum + parseFloat(s.unpaid_amount), 0),
      totalPaidCount: staffClearance.reduce((sum, s) => sum + s.paid_count, 0),
      totalUnpaidCount: staffClearance.reduce((sum, s) => sum + s.unpaid_count, 0)
    };

    logger.info(`Staff clearance for ${date}: ${totals.totalStaff} staff, ${totals.totalOrders} orders, total=${totals.totalSales}`);

    res.render('staff_clearance', {
      title: 'Staff Clearance',
      userName: user ? (user.email || 'Admin') : 'Admin',
      selectedDate: date,
      staffClearance,
      totals
    });
  } catch (err) {
    logger.error('Error showing staff clearance page: ' + (err && err.message ? err.message : err));
    res.status(500).send('Failed to load staff clearance page');
  }
};

// Show detailed sales for a specific staff member
staffClearanceController.showStaffDetails = async function (req, res, next) {
  try {
    const user = req.session && req.session.user ? req.session.user : null;
    
    if (!user || user.role !== 'admin') {
      logger.warn(`Unauthorized access to staff details by user: ${user ? user.email : 'anonymous'}`);
      return res.status(403).send('Access Denied');
    }

    const { staffId } = req.params;
    const today = new Date().toISOString().slice(0, 10);
    const { date = today } = req.query;

    const staffSales = await salesModel.getStaffSalesForDate(staffId, date);
    const totalSales = staffSales.reduce((sum, s) => sum + parseFloat(s.amount), 0);
    const paidSales = staffSales.filter(s => s.payment_status === 'paid');
    const unpaidSales = staffSales.filter(s => s.payment_status === 'unpaid');

    logger.info(`Staff details for staff_id=${staffId} date=${date}: ${staffSales.length} sales`);

    res.render('staff_details', {
      title: 'Staff Sales Details',
      userName: user ? (user.email || 'Admin') : 'Admin',
      staffId,
      selectedDate: date,
      staffSales,
      paidSales,
      unpaidSales,
      totalSales,
      paidTotal: paidSales.reduce((sum, s) => sum + parseFloat(s.amount), 0),
      unpaidTotal: unpaidSales.reduce((sum, s) => sum + parseFloat(s.amount), 0)
    });
  } catch (err) {
    logger.error('Error showing staff details: ' + (err && err.message ? err.message : err));
    res.status(500).send('Failed to load staff details');
  }
};

// Update payment status
staffClearanceController.updatePaymentStatus = async function (req, res, next) {
  try {
    const user = req.session && req.session.user ? req.session.user : null;
    
    if (!user || user.role !== 'admin') {
      logger.warn(`Unauthorized payment update by user: ${user ? user.email : 'anonymous'}`);
      return res.status(403).json({ success: false, message: 'Access Denied' });
    }

    const { saleId, paymentStatus } = req.body;

    if (!saleId || !paymentStatus) {
      logger.warn('Missing saleId or paymentStatus in payment update');
      return res.status(400).json({ success: false, message: 'Missing saleId or paymentStatus' });
    }

    if (!['paid', 'unpaid'].includes(paymentStatus.toLowerCase())) {
      logger.warn(`Invalid payment status: ${paymentStatus}`);
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const result = await salesModel.updatePaymentStatus(saleId, paymentStatus.toLowerCase());

    if (result && result.affectedRows > 0) {
      logger.info(`Payment status updated: sale_id=${saleId} status=${paymentStatus}`);
      return res.json({ success: true, message: 'Payment status updated successfully' });
    } else {
      logger.warn(`Failed to update payment status for sale_id=${saleId}`);
      return res.status(500).json({ success: false, message: 'Failed to update payment status' });
    }
  } catch (err) {
    logger.error('Error updating payment status: ' + (err && err.message ? err.message : err));
    res.status(500).json({ success: false, message: 'Failed to update payment status' });
  }
};

// Show unpaid debts/outstanding payments
staffClearanceController.showUnpaidDebts = async function (req, res, next) {
  try {
    const user = req.session && req.session.user ? req.session.user : null;
    
    if (!user || user.role !== 'admin') {
      logger.warn(`Unauthorized access to unpaid debts by user: ${user ? user.email : 'anonymous'}`);
      return res.status(403).send('Access Denied: Only administrators can access this page.');
    }

    const [unpaidDebts, unpaidByStaff] = await Promise.all([
      salesModel.getUnpaidDebts(),
      salesModel.getUnpaidByStaff()
    ]);

    const totalUnpaid = unpaidDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

    logger.info(`Unpaid debts: ${unpaidDebts.length} transactions, total=${totalUnpaid}`);

    res.render('staff_unpaid_debts', {
      title: 'Unpaid Debts',
      userName: user ? (user.email || 'Admin') : 'Admin',
      unpaidDebts,
      unpaidByStaff,
      totalUnpaid,
      totalTransactions: unpaidDebts.length
    });
  } catch (err) {
    logger.error('Error showing unpaid debts: ' + (err && err.message ? err.message : err));
    res.status(500).send('Failed to load unpaid debts page');
  }
};

module.exports = staffClearanceController;
