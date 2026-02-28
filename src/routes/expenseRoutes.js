const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.get('/expenses', authMiddleware, requireRole(['admin']), expenseController.showExpensesPage);
router.get('/expenses/new', authMiddleware, requireRole(['admin']), expenseController.showAddExpensePage);
router.post('/expenses/add', authMiddleware, requireRole(['admin']), expenseController.createExpense);
router.post('/expenses/:id/status', authMiddleware, requireRole(['admin']), expenseController.updateExpenseStatus);

module.exports = router;