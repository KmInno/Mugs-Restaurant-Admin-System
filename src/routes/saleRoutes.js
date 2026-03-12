const express = require('express');
const router = express.Router();
const saleController = require('../controllers/salesController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.get('/sales', authMiddleware, saleController.showSalesPage);
router.get('/sales/add', authMiddleware, saleController.showAddSalePage);
router.post('/sales', authMiddleware, saleController.addOrder);
// Only admin can change sale status
router.post('/sales/:id/status', authMiddleware, requireRole(['admin']), saleController.updateSaleStatus);
// Debtors view limited to admin
router.get('/sales/debtors', authMiddleware, requireRole(['admin']), saleController.showDebtorsPage);
// Added a route to fetch sales made on the current day
router.get('/sales/today', authMiddleware, saleController.showTodaySales);
// Print sales orders
router.get('/sales/print', authMiddleware, saleController.printSales);
// Print single order
router.get('/sales/:id/print', authMiddleware, saleController.printSingleOrder);

module.exports = router;