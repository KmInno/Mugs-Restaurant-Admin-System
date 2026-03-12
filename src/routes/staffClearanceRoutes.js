const express = require('express');
const router = express.Router();
const staffClearanceController = require('../controllers/staffClearanceController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Staff clearance page - Admin only
router.get('/clearance', authMiddleware, requireRole(['admin']), staffClearanceController.showStaffClearancePage);

// Staff details - Admin only
router.get('/clearance/:staffId/details', authMiddleware, requireRole(['admin']), staffClearanceController.showStaffDetails);

// Update payment status - Admin only
router.post('/clearance/payment/update', authMiddleware, requireRole(['admin']), staffClearanceController.updatePaymentStatus);

// Unpaid debts - Admin only
router.get('/clearance/debts', authMiddleware, requireRole(['admin']), staffClearanceController.showUnpaidDebts);

module.exports = router;
