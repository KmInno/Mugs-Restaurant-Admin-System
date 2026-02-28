const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Settings main
// Make settings admin-only
router.get('/settings', authMiddleware, requireRole(['admin']), settingsController.showSettings);

// Expense templates
router.get('/settings/expenses/templates', authMiddleware, requireRole(['admin']), settingsController.showExpenseTemplates);
router.get('/settings/expenses/templates/add', authMiddleware, requireRole(['admin']), settingsController.showAddTemplate);
router.post('/settings/expenses/templates/add', authMiddleware, requireRole(['admin']), settingsController.createTemplate);
router.get('/settings/expenses/templates/:id/edit', authMiddleware, requireRole(['admin']), settingsController.showEditTemplate);
router.post('/settings/expenses/templates/:id/edit', authMiddleware, requireRole(['admin']), settingsController.updateTemplate);
// Allow admin and staff to view and manage inventory
router.get('/settings/inventory', authMiddleware, requireRole(['admin','staff']), settingsController.showInventory);
router.get('/settings/inventory/add', authMiddleware, requireRole(['admin','staff']), settingsController.showAddInventory);
router.post('/settings/inventory/add', authMiddleware, requireRole(['admin','staff']), settingsController.createInventoryItem);
router.post('/settings/inventory/:id/status', authMiddleware, requireRole(['admin','staff']), settingsController.updateInventoryStatus);

module.exports = router;
